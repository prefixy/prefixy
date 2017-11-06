const express = require("express");
const router = express.Router();
const path = require("path");
const Celebrate = require("celebrate");

const scoreSchema = require(path.resolve(path.dirname(__dirname), "schema/scoreSchema"));
const scoreController = require(path.resolve(path.dirname(__dirname), "controllers/scoreController.js"));
const incrementSchema = require(path.resolve(path.dirname(__dirname), "schema/incrementSchema"));
const incrementController = require(path.resolve(path.dirname(__dirname), "controllers/incrementController.js"));

router.get("/", (req, res) => {
  res.send("Welcome to Prefixy");
});

router.put("/score", Celebrate({body: scoreSchema}), scoreController);
router.put("/increment", Celebrate({body: incrementSchema}), incrementController);

module.exports = router;
