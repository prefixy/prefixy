const Celebrate = require("celebrate");
const { Joi } = Celebrate;

// const get = Joi.object().keys({
//     prefix: Joi.string().required(),
//     limit: Joi.number(),
//     withScores: Joi.boolean(),
//   });

// const post = Joi.array()
//     .items(
//       Joi.string(), 
//       Joi.object().keys({
//           completion: Joi.string().required(),
//           score: Joi.number(),
//         }
//   ));

// const deleteJoi = Joi.array().items(Joi.string().required());

module.exports = Joi.object().keys({
    prefix: Joi.string().required(),
    limit: Joi.number(),
    withScores: Joi.boolean(),
  });