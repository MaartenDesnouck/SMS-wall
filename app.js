var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose(); //add verbose for long stack traces
var SmsGateway = require('./public/js/smsgateway');

var smswall = require('./routes/smswall');
var clublied = require('./routes/clublied');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

//config inladen
var config = require('config');
var smsgateway_username = config.get('smsgateway.username');
var smsgateway_password = config.get('smsgateway.password');

//smsgateway inloggen
var gateway = new SmsGateway(smsgateway_username, smsgateway_password);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'images/favicon.ico')));
//app.use(logger('dev')); // Om GET e.d. te loggen
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', smswall);
app.use('/clublied', clublied);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//Constanten hardcoden
var interval_fillDatabase = 5; //seconden
var interval_updateClient = 1; //seconden
var smsen_per_pagina = 15;
var start_timeStamp = Math.floor((new Date).getTime()/1000);

//Socket IO functions
var stopcontact = null; //om te kunnen emitten van de ander functies
io.sockets.on('connection', function(socket){
  stopcontact = socket;
  //Laatste 1O smsen direct doorsturen zodat het scherm vol is na refresh
  var db = new sqlite3.Database('sqlite.db');
  db.configure("busyTimeout", 60000);
  db.each("SELECT message FROM (SELECT message, created_at FROM messages WHERE displayed is 'true' ORDER BY created_at DESC Limit "+smsen_per_pagina+") ORDER BY created_at ASC; ", function(err, row) {
      pushMessage(stopcontact, row.message);
  });
  db.close();
}); //einde van io.on(connection)

//On disconnect of socket
io.sockets.on('disconnect', function () {
    stopcontact = null;
});

// SMSgateway checken en nieuwe berichten inladen
function fillDatabase() {
  //tellen hoeveel berichten we nu al hebben, zodat welke pagina we moeten opvragen van smsgateway
  //console.log('[fillDatabase]');
  var db = new sqlite3.Database('sqlite.db');
  db.configure("busyTimeout", 60000);
  db.get("SELECT COUNT(*) as count FROM messages", function(err, row) {
      var pagina = Math.ceil((row.count+1)/500);
      var oude = row.count%500;
      //console.log("Pagina:"+pagina);
      //console.log("Oude:"+oude);
      fillDatabaseWithPage(pagina, oude);
  });
  db.close();
  setTimeout(fillDatabase, interval_fillDatabase * 1000);
}
fillDatabase();

// Database checken en nieuwe berichten pushen
function updateClient() {
  //console.log('[pushMessage]');
  var db = new sqlite3.Database('sqlite.db');
  db.configure("busyTimeout", 60000);
  db.each("SELECT gateway_id, message FROM messages WHERE displayed is 'false' ORDER BY created_at ASC Limit 1", function(err, row) {
      pushMessage(stopcontact, row.message, row.gateway_id);
      // console.log(row);
  });
  db.close();
  setTimeout(updateClient, interval_updateClient * 1000);
}
updateClient();

// Stuur een SMS door naar de client
function pushMessage(socket, sms, gateway_id) {
  //console.log('[pushMessage]');
  if(socket!=null){
      if(gateway_id!=null){
          logmessage = 'Pushed new SMS - '+gateway_id+' - '+sms;
          console.log(logmessage.yellow);
      }
      else{
          logmessage = 'Pushed to refresh page - '+sms;
          console.log(logmessage.grey);
      }
      updateDisplayStatusInDatabase(gateway_id, 'true');
      socket.emit('newMessage', {
          sms: sms
      });
  }
}

//Database met specifieke pagina updaten
function fillDatabaseWithPage(page, oude) {
    //console.log('[fillDatabaseWithPage:'+page+']');
    gateway.getMessages(page).then(function(data){
        laatsteBerichtenPagina = data;
        //console.log("SMSEN op page "+page+":"+laatsteBerichtenPagina.length);
        for(messages=0;messages<laatsteBerichtenPagina.length-oude;messages++){
            var gateway_id = laatsteBerichtenPagina[messages].id;
            var bericht = laatsteBerichtenPagina[messages].message;
            var status = laatsteBerichtenPagina[messages].status;
            var phonenumber = laatsteBerichtenPagina[messages].contact.number;
            var created_at = laatsteBerichtenPagina[messages].created_at;
            var displayed = 'false';
            var epoch = Math.floor((new Date).getTime()/1000);
            if(created_at>start_timeStamp+3600){ //in het laatste uur
                insertMessageIntoDatabase(gateway_id, bericht, status, phonenumber, epoch, displayed);
            }
        }
    }).fail(function(message){
        console.log('failed',message);
    });
}

//een bericht in de database steken of updaten
function insertMessageIntoDatabase(gateway_id, bericht, status, phonenumber, created_at, displayed){
    var db = new sqlite3.Database('sqlite.db');
    db.configure("busyTimeout", 60000);
    db.run("INSERT OR IGNORE INTO messages (gateway_id , message, status, phonenumber, created_at, displayed) VALUES ($gateway_id, $message, $status, $phonenumber, $created_at, $displayed)", {
        $gateway_id: gateway_id,
        $message: bericht,
        $status: status,
        $phonenumber: correctPhonenumber(phonenumber),
        $created_at: created_at,
        $displayed: displayed
    });
    db.close();
}

// displaystatus van een bericht in database updaten
function updateDisplayStatusInDatabase(gateway_id, newStatus){
    var db = new sqlite3.Database('sqlite.db');
    db.configure("busyTimeout", 60000);
    //console.log("MESSAGE_UPDATE:"+gateway_id);
    db.run("UPDATE messages SET displayed=$status WHERE gateway_id=$gateway_id",{
        $gateway_id: gateway_id,
        $status: newStatus,
    });
    db.close();
}

//phonenumberconversie: 00 -> +
function correctPhonenumber(phonenumber){
    //console.log("correctPhonenumber: "+phonenumber);
    if(phonenumber.length>1 && phonenumber.substring(0,2)=="00"){
        return '+'+phonenumber.substring(2,phonenumber.length-1);
    } else {
        return phonenumber;
    }
}

module.exports = app;
