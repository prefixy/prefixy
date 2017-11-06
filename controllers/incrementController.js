const path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

module.exports = async function(req, res, next) {
  const completion = req.body.completion;
  let scores;

  try {
    scores = await Prefixy.bumpScoreFixed(completion);
  } catch(e) {
    const error = "The request could not be processed";
    res.status(422).json({error});
  }

  res.status(204).send();
};
