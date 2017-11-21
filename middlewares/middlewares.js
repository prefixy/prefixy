const path = require('path');
const tenant = require(path.resolve(path.dirname(__dirname), 'tenant'));
const jwt = require("jsonwebtoken");

const resolveTenant = token => {
  tenant.setTenant(jwt.verify(token, process.env.SECRET).tenant);
};

module.exports = {
  authenticate: function(req, res, next) {
    try {
      if (req.query.token) {
        resolveTenant(req.query.token);
      } else {
        resolveTenant(req.body.token);
      }
    } catch(error) {
      error.status = 401;
      return next(error);
    }

    next();
  }
};
