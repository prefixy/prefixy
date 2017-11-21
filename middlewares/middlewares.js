const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));
const jwt = require("jsonwebtoken");

const resolveTenant = token => {
  Prefixy.tenant = jwt.verify(token, process.env.SECRET).tenant;
};

module.exports = {
  authenticate: function(req, res, next) {
    try {
      resolveTenant(req.query.token);
    } catch(error) {
      error.status = 401;
      return next(error);
    }

    next();
  }
};
