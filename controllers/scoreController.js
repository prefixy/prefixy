const path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

module.exports = async function(req, res, next) {
  const completion = req.body.completion;
  const score = req.body.score;

  try {
    await Prefixy.setScore(true, score);
  } catch(error) {
    error.message = "The request could not be processed";
    return next(error);
  }

  res.json({completion, score});
};
