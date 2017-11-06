const express = require("express");
const router = express.Router();
const path = require("path");
const Celebrate = require("celebrate");
const { Joi } = Celebrate;

const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

const scoreSchema = require(path.resolve(path.dirname(__dirname), "schema/scoreSchema"));
const scoreController = require(path.resolve(path.dirname(__dirname), "controllers/scoreController.js"));
const incrementSchema = require(path.resolve(path.dirname(__dirname), "schema/incrementSchema"));
const incrementController = require(path.resolve(path.dirname(__dirname), "controllers/incrementController.js"));
const dynamicIncrementController = require(path.resolve(path.dirname(__dirname), "controllers/dynamicIncrementController.js"));
const completionsSchema = require(path.resolve(path.dirname(__dirname), "schema/completionsSchema"));
const completionsController = require(path.resolve(path.dirname(__dirname), "controllers/completionsController.js"));

router.get('/completions', Celebrate({query: completionsSchema.get}), completionsController.get);
router.post('/completions', Celebrate({body: completionsSchema.post}), completionsController.post);
router.delete('/completions', Celebrate({body: completionsSchema.delete}), completionsController.delete);
router.put('/dynamic-increment', Celebrate({body: incrementSchema}), dynamicIncrementController);
router.put("/increment", Celebrate({body: incrementSchema}), incrementController);
router.put("/score", Celebrate({body: scoreSchema}), scoreController);

module.exports = router;
