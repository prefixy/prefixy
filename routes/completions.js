var express = require('express');
var router = express.Router();
var path = require('path');
const _ = require('lodash');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

const formatCompletionsWithScores = completions => {
  return _.chunk(completions, 2).map(completion => (
    {
      completion: completion[0],
      score: completion[1]
    }
  ));
};

router.get('/', async function(req, res) {
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

module.exports = router;
