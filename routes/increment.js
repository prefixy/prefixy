const express = require("express");
const router = express.Router();
const path = require("path");
const Celebrate = require("celebrate");

const incrementSchema = require(path.resolve(path.dirname(__dirname), "schema/incrementSchema"));
const incrementController = require(path.resolve(path.dirname(__dirname), "controllers/incrementController.js"));

router.put("/", Celebrate({body: incrementSchema}), incrementController);

module.exports = router;
