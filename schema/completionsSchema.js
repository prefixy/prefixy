const Celebrate = require("celebrate");
const { Joi } = Celebrate;

module.exports = {
  get: Joi.object().keys({
    prefix: Joi.string().required(),
    limit: Joi.number(),
    scores: Joi.boolean(),
    token: Joi.string().required(),
  }),

  post: Joi.object().keys({
    token: Joi.string().required(),
    completions: Joi.array().items(Joi.string().required()),
  }),

  delete: Joi.object().keys({
    token: Joi.string().required(),
    completions: Joi.array().items(Joi.string().required()),
  }),
};
