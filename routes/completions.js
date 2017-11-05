var express = require('express');
var router = express.Router();
var path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

/* GET home page. */
router.get('/', function(req, res, next) {
  // const prefix = JSON.parse(req.body);
  // console.log(prefix);
  res.send("good stuff");
});

router.delete('/', function(req, res, next) {
  const completions = req.body;
  if (!Array.isArray(completions)) {
    res.status(422).send("must send valid JSON of completions to delete");
  }

  Prefixy.deleteCompletions(completions);

  console.log("Deleted", completions);

  res.sendStatus(204);
});

router.post('/', function(req, res, next) {
  const completions = req.body;
  if (!Array.isArray(completions)) {
    res.status(422).send("must send valid JSON of completions to insert");
  }

  if (completions[0].completion) {
    Prefixy.insertCompletionsWithScores(completions);
  } else {
    Prefixy.insertCompletions(completions);
  }

  console.log("Inserted", completions);

  res.sendStatus(204);
});

module.exports = router;
