const express = require("express");
const router = express.Router();
const path = require("path");
const Celebrate = require("celebrate");
const _ = require('lodash');

const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

const scoreSchema = require(path.resolve(path.dirname(__dirname), "schema/scoreSchema"));
const scoreController = require(path.resolve(path.dirname(__dirname), "controllers/scoreController.js"));
const incrementSchema = require(path.resolve(path.dirname(__dirname), "schema/incrementSchema"));
const incrementController = require(path.resolve(path.dirname(__dirname), "controllers/incrementController.js"));

router.get("/", (req, res) => {
  res.send("Welcome to Prefixy");
}

const formatCompletionsWithScores = completions => {
  return _.chunk(completions, 2).map(completion => (
    {
      completion: completion[0],
      score: completion[1]
    }
  ));
};

router.get('/completions', async function(req, res) {
  const prefix = req.body.prefix;
  const opts = {
    limit: req.body.limit || 5,
    withScores: req.body.withScores || false,
  };
  let completions = await Prefixy.search(prefix, opts);

  if (opts.withScores) {
    completions = formatCompletionsWithScores(completions);
  }

  res.json(completions);
});

router.put('/dynamic-increment', async function(req, res) {
  const completion = req.body.completion;
  const scores = await Prefixy.dynamicIncrementScore(completion);

  res.json({ completion, score: scores[0] });
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

router.put("/score", Celebrate({body: scoreSchema}), scoreController);
router.put("/increment", Celebrate({body: incrementSchema}), incrementController);

module.exports = router;
