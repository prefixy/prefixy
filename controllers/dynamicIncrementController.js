const path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

module.exports = async function(req, res, next) {
  const completion = req.body.completion;

  try {
    await Prefixy.dynamicIncrementScore(completion);
  } catch(error) {
    error.status = 422;
    next(error);
    return;

  }

  res.sendStatus(204);
};