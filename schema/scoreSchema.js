const Celebrate = require('celebrate');
const { Joi } = Celebrate;

module.exports = Joi.object().keys({
  completion: Joi.string().required(),
  score: Joi.number().required()
});
