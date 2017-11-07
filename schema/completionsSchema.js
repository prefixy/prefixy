const Celebrate = require("celebrate");
const { Joi } = Celebrate;

module.exports = {
  get: Joi.object().keys({
    prefix: Joi.string().required(),
    limit: Joi.number(),
    scores: Joi.boolean(),
  }),

  post: Joi.array().items(
    Joi.string(),
    Joi.object().keys({
      completion: Joi.string().required(),
      score: Joi.number().required(),
    })),

  delete: Joi.array().items(Joi.string().required())
};
