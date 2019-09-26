var express = require('express');
var router = express.Router();

/* GET smswall page. */
router.get('/', function(req, res, next) {
    res.render('smswall', {
        title: 'VTK SMS-WALL' ,
        sidebar_active_smswall: 'active',
        sidebar_active_clublied: '',
        sidebar: 'vtk'
    });
});

router.get('/vtk', function(req, res, next) {
    res.render('smswall', {
        title: 'VTK SMS-WALL' ,
        sidebar_active_smswall: 'active',
        sidebar_active_clublied: '',
        sidebar: 'vtk'
    });
});

router.get('/speeddate', function(req, res, next) {
    res.render('smswall', {
        title: 'Speeddate SMS-WALL' ,
        sidebar_active_smswall: 'active',
        sidebar: 'speeddate'
    });
});

router.get('/delta', function(req, res, next) {
    res.render('smswall', {
        title: 'Delta SMS-WALL' ,
        sidebar_active_smswall: 'active',
        sidebar: 'delta'
    });
});

module.exports = router;
