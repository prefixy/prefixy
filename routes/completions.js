const express = require('express');
const router = express.Router();
const path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

/* GET home page. */
router.get('/', function(req, res, next) {
  const prefix = JSON.parse(req.body);
  console.log(prefix);
  res.send("");
});

module.exports = router;
