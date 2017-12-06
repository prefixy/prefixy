const path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));
const tenant = require(path.resolve(path.dirname(__dirname), 'tenant'));
const jwt = require("jsonwebtoken");

module.exports = async function(req, res, next) {
  const completion = req.body.completion;

  try {
    await Prefixy.invoke(() => Prefixy.increment(completion, tenant.getTenant()));
  } catch(error) {
    return next(error);
  }

  res.sendStatus(204);
};
