const express = require("express");
const router = express.Router();
const path = require("path");

const middlewares = require(path.resolve(path.dirname(__dirname), "middlewares/middlewares"));
const incrementSchema = require(path.resolve(path.dirname(__dirname), "schema/incrementSchema"));
const incrementController = require(path.resolve(path.dirname(__dirname), "controllers/incrementController.js"));
const completionsSchema = require(path.resolve(path.dirname(__dirname), "schema/completionsSchema"));
const completionsController = require(path.resolve(path.dirname(__dirname), "controllers/completionsController.js"));

router.get('/completions',
  middlewares.authenticate,
  Celebrate({query: completionsSchema.get}),
  completionsController.get
);

router.post('/completions',
  middlewares.authenticate,
  Celebrate({body: completionsSchema.post}),
  completionsController.post
);

router.delete('/completions',
  middlewares.authenticate,
  Celebrate({body: completionsSchema.delete}),
  completionsController.delete
);

router.put("/increment",
  middlewares.authenticate,
  Celebrate({body: incrementSchema}),
  incrementController
);

module.exports = router;
