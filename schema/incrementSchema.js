const Celebrate = require('celebrate');
const { Joi } = Celebrate;

module.exports = Joi.object().keys({
  token: Joi.string().required(),
  completion: Joi.string().required(),
});
