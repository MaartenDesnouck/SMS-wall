$(function () {
    var socket = io.connect();
    var $smsList = $('#smsList');

    socket.on("newMessage", function(data) {
        console.log(data);
        var sms = data.sms
        $('<li class="list-group-item"><img src="images/message.png" />' + sms + '</li>').prependTo($smsList).hide().slideDown();

        while($smsList[0].childElementCount > 15){ //Wanneer meer dan 15 smsen getoond worden, laatste verwijderen
            $smsList[0].lastChild.remove();
        }
    });
});
