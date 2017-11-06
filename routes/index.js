var express = require('express');
var router = express.Router();
var path = require('path');
const Prefixy = require(path.resolve(path.dirname(__dirname), 'prefixy'));

router.put('/dynamic-increment', async function(req, res) {
  const completion = req.body.completion;
  const scores = await Prefixy.dynamicIncrementScore(completion);

  res.json({ completion, score: scores[0] });
});

module.exports = router;
