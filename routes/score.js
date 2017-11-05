const express = require("express");
const router = express.Router();
const path = require("path");
const Celebrate = require("celebrate");

const scoreSchema = require(path.resolve(path.dirname(__dirname), "schema/scoreSchema"));
const scoreController = require(path.resolve(path.dirname(__dirname), "controllers/scoreController.js"));

router.put("/", Celebrate({body: scoreSchema}), scoreController);

module.exports = router;
