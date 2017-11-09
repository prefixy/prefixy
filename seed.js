const path = require("path");
const Prefixy = require(path.resolve(__dirname, "prefixy"));

const funNames = ['jay', 'tiffany', 'walid', 'kevin', 'waldo', 'wally', 'walden', 'jays', 'jacqueline', 'jay', 'jones', 'jay jay', 'homer jay simpson', 'tin', 'tim', 'timbuktu', 'till', 'true'];

Prefixy.invoke(() => Prefixy.insertCompletions(funNames));

Prefixy.invoke(() => Prefixy.fixedIncrementScore("walid"));
Prefixy.invoke(() => Prefixy.fixedIncrementScore("waldo"));
Prefixy.invoke(() => Prefixy.fixedIncrementScore("waldo"));

Prefixy.invoke(() => Prefixy.insertCompletions([{completion: "walter", score: 500}]));

const sample = [
  { completion: "mary", score: 20 },
  { completion: "poppins", score: 5 },
  { completion: "walmart", score: 10 },
  { completion: "wario", score: 0 },
  { completion: "waluigi", score: 1 },
  { completion: "javascript", score: 99 },
  { completion: "reddit", score: 44 },
  { completion: "hackernews", score: 2 },
  { completion: "chris lee", score: 20 },
  { completion: "nascar", score: 20 },
  { completion: "walid", score: 1000 },
]

Prefixy.invoke(() => Prefixy.insertCompletions(sample));
Prefixy.client.quit();