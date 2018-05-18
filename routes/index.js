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

router.get('/*', function(req, res, next) {
  if (req.url === '/checkout/card?fixture=1')
    res.sendFile(path.join(__dirname, '../public/index2.html'));
});

module.exports = router;