var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

/* GET home page. */
router.get('/frontend', function(req, res, next) {
  let dir = fs.readdirSync(
    path.join(__dirname, '../../vospay/frontend/build/static/js')
  );
  let file = dir[0];
  res.sendFile(
    path.join(__dirname, `../../vospay/frontend/build/static/js/${file}`)
  );
});

router.get('/checkout/card', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/index2.html'));
});

router.get('/activate', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/index2.html'));
});

module.exports = router;
