var express = require('express');
var router = express.Router();
var path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));


/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("hello world");
});

router.delete('/completions', async function(req, res, next) {
  try {
    const completions = req.body;
    await Prefixy.deleteCompletions(completions);
  } catch(error) {
    error.status = 422;
    next(error);
    return;
  } 
  
  res.sendStatus(204);
});

router.post('/completions', async function(req, res, next) {
  try {
    const completions = req.body;
    if (completions[0].completion) {
      await Prefixy.insertCompletionsWithScores(completions);
    } else {
      await Prefixy.insertCompletions(completions);
    }
  } catch(error) {
    error.status = 422;
    next(error);
    return;
  }
  
  res.sendStatus(204);
});

module.exports = router;
