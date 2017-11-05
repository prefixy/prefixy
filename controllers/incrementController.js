const path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

const notFound = scores => (
  scores.every(score => score === null)
);

module.exports = async function(req, res) {
  const completion = req.body.completion;
  let scores;

  try {
    scores = await Prefixy.bumpScoreFixed(completion);
  } catch(e) {
    const error = "The request could not be processed";
    res.status(500).json({error: error});
  }

  if (notFound(scores)) {
    const error = "The completion does not exist in the index";
    res.status(404).json({error: error});
  }

  res.json({ completion: completion, scores: scores });
};