const path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));
const jwt = require("jsonwebtoken");

const findTenant = token => {
  return jwt.verify(token, process.env.SECRET).tenant;
};

module.exports = async function(req, res, next) {
  let tenant;
  try {
    tenant = findTenant(req.body.token);
  } catch(error) {
    error.status = 401;
    return next(error);
  }

  const completion = req.body.completion;

  try {
    await Prefixy.invoke(() => Prefixy.increment(completion, tenant));
  } catch(error) {
    return next(error);
  }

  res.sendStatus(204);
};
