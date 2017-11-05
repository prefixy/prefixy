const path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

module.exports = async function(req, res) {
  const completion = req.body.completion;
  const score = req.body.score;

  try {
    await Prefixy.setScore(completion, score);
  } catch(e) {
    const error = "The request could not be processed";
    res.status(500).json({error: error});
  }

  res.json(req.body);
};
