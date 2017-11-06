const path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));
const _ = require('lodash');

const formatCompletionsWithScores = completions => {
  return _.chunk(completions, 2).map(completion => (
    {
      completion: completion[0],
      score: completion[1]
    }
  ));
};

module.exports = {
  get: async function(req, res) {
    const prefix = req.query.prefix;
    const opts = {
      limit: req.query.limit || 5,
      withScores: req.query.scores || false,
    };
    let completions = await Prefixy.search(prefix, opts);

    if (opts.withScores) {
      completions = formatCompletionsWithScores(completions);
    }

    res.json(completions);
  },
  post: async function(req, res, next) {
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
  },
  delete: async function(req, res, next) {
    try {
      const completions = req.body;
      await Prefixy.deleteCompletions(completions);
    } catch(error) {
      error.status = 422;
      next(error);
      return;
    }

    res.sendStatus(204);
  },
}