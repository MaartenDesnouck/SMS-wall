var express = require('express');
var router = express.Router();

/* GET clublied page. */
router.get('/', function(req, res, next) {
  res.render('clublied', {
      title: 'VTK Clublied' ,
      sidebar_active_smswall: '',
      sidebar_active_clublied: 'active',
  });
});


module.exports = router;
