const Celebrate = require('celebrate');
const { Joi } = Celebrate;

module.exports = {
  completion: Joi.string().required(),
  score: Joi.number().required()
};