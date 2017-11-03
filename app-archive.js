const redis = require("redis");
// TODO: make createClient its own method, in order
// to pass in custom config options
const client = redis.createClient();
const fs = require("fs");
// later: configuration option - include full string
// also clean up completions before insertCompletionsing
// E.g. normalize case and whitespaces

// path represents a relative path from directory of app.js
// or absolute path
// currently expects array of completions in a json file
const importFile = path => {
  let data;
  try {
    data = fs.readFileSync(path, "utf-8");
  } catch (e) {
    console.log(`ERROR: ${e.path} is not a valid file path`);
    return;
  }
  const dataJson = JSON.parse(data);
  insertCompletions(dataJson);
};

const insertCompletions = completions => {
  completions.forEach(completion => {
    const prefixes = extractPrefixes(completion);
    index(prefixes, completion);
  });
  return completions.length;
};

// takes an array of completions with scores
// e.g. [{ completion: "string", score: -13 }]
const insertCompletionsWithScores = completionsWithScores => {
  completionsWithScores.forEach(item => {
    const prefixes = extractPrefixes(item.completion);
    index(prefixes, item.completion, item.score);
  });
};

const insertCompletion = completion => {
  insertCompletions([completion]);
  return 1;
};

const deleteCompletions = completions => {
  completions.forEach(completion => {
    const prefixes = extractPrefixes(completion);
    remove(prefixes, completion);
  });
  return completions.length;
};

const deleteCompletion = completion => {
  deleteCompletions([completion]);
  return 1;
};

const extractPrefixes = completion => {
  const prefixes = [];
  for (let i = 1; i <= completion.length; i++) {
    prefixes.push(completion.slice(0, i));
  }
  return prefixes;
};

const index = (prefixes, completion, score=0) => {
  prefixes.forEach(prefix =>
    client.zadd(prefix, score, completion)
  );
};

const remove = (prefixes, completion) => {
  prefixes.forEach(prefix =>
    client.zrem(prefix, completion)
  );
};

const search = prefixQuery => {
  client.zrange(prefixQuery, 0, -1, (err, reply) =>
    console.log(reply)
  );
};

const searchWithScores = prefixQuery => {
  client.zrange(prefixQuery, 0, -1, 'WITHSCORES', (err, reply) =>
    console.log(reply)
  );
};

const returnTopXSuggestions = suggestionCount => {
  return prefixQuery => {
    client.zrange(prefixQuery, 0, suggestionCount - 1, (err, reply) =>
      console.log(reply)
    );
  }
};

const returnTopXSuggestionsWithScores = suggestionCount => {
  return prefixQuery => {
    client.zrange(prefixQuery, 0, suggestionCount - 1, 'WITHSCORES', (err, reply) =>
      console.log(reply)
    );
  }
};

const top5Suggestions = returnTopXSuggestions(5);
const top3Suggestions = returnTopXSuggestions(3);
const top5SuggestionsWithScores = returnTopXSuggestionsWithScores(5);

// we increment by -1, bc this enables us to sort
// by frequency plus ascending lexographical order in Redis
const bumpScore = completion => {
  const prefixes = extractPrefixes(completion);
  prefixes.forEach(prefix =>
    client.zincrby(prefix, -1, completion)
  );
  return;
};

const setScore = (completion, score) => {
  const prefixes = extractPrefixes(completion);
  prefixes.forEach(prefix =>
    client.zadd(prefix, score, completion)
  );
};

module.exports = {
  client,
  insertCompletions,
  insertCompletionsWithScores,
  importFile,
  extractPrefixes,
  index,
  search,
  searchWithScores,
  bumpScore,
  setScore,
  returnTopXSuggestions,
  top5Suggestions,
  top5SuggestionsWithScores,
  deleteCompletion,
};

// module.exports = {
//   importFile: function(path) {
//     let data;
//     try {
//       data = fs.readFileSync(path, "utf-8");
//     } catch (e) {
//       console.log(`ERROR: ${e.path} is not a valid file path`);
//       return;
//     }
//     const dataJson = JSON.parse(data);
//     this.foobar(dataJson);
//   },
//   foobar: completions => {
//     // completions.forEach(completion => {
//     //   const prefixes = this.extractPrefixes(completion);
//     //   index(prefixes, completion);
//     // });
//     return completions.length;
//   }
// };
