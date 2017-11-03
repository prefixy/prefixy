var express = require('express');
var router = express.Router();
var path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy');

/* GET home page. */
router.get('/', function(req, res, next) {
  const prefix = JSON.parse(req.body);
  console.log(prefix);
  res.send("");
});

module.exports = router;
