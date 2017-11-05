const path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

module.exports = async function(req, res, next) {
  const completion = req.body.completion;
  let scores;

  try {
    scores = await Prefixy.bumpScoreFixed(true);
  } catch(error) {
    error.message = "The request could not be processed";
    return next(error);
  }

  res.status(204).send();
};