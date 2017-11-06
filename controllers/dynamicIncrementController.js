const path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

module.exports = async function(req, res, next) {
  const completion = req.body.completion;
  const scores = await Prefixy.dynamicIncrementScore(completion);

  res.json({ completion, score: scores[0] });
};
