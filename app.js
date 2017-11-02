const redis = require("redis");
// TODO: make createClient its own method, in order
// to pass in custom config options
const fs = require("fs");
const client = redis.createClient();
// later: configuration option - include full string
// also clean up completions before insertCompletionsing
// E.g. normalize case and whitespaces

// path represents a relative path from directory of app.js
// or absolute path
// currently expects array of completions in a json file


// helpers

const returnTopXSuggestions = function(suggestionCount) {
  return prefixQuery => {
    return new Promise((resolve, reject) => {
      client.zrange(prefixQuery, 0, suggestionCount - 1, (err, reply) =>
        resolve(reply)
      );
    });
  }
};

const returnTopXSuggestionsWithScores = function(suggestionCount) {
  return prefixQuery => {
    return new Promise((resolve, reject) => {
      client.zrange(prefixQuery, 0, suggestionCount - 1, 'WITHSCORES', (err, reply) =>
        resolve(reply)
      );
    });
  }
};

// exported functions
module.exports = {
  client: client,
  importFile: function(path) {
    let data;
    try {
      data = fs.readFileSync(path, "utf-8");
      // TO MAYBE:
      // data = fs.readFileSync(process.cwd() + path, "utf-8");
    } catch (e) {
      console.log(`ERROR: ${e.path} is not a valid file path`);
      return;
    }
    const dataJson = JSON.parse(data);
    this.insertCompletions(dataJson);
  },

  insertCompletions: function(completions) {
    completions.forEach(completion => {
      const prefixes = this.extractPrefixes(completion);
      this.index(prefixes, completion);
    });
    return completions.length;
  },

  // takes an array of completions with scores
  // e.g. [{ completion: "string", score: -13 }]
  insertCompletionsWithScores: function(completionsWithScores) {
    completionsWithScores.forEach(item => {
      const prefixes = this.extractPrefixes(item.completion);
      this.index(prefixes, item.completion, item.score);
    });
  },

  insertCompletion: function(completion) {
    this.insertCompletions([completion]);
    return 1;
  },

  deleteCompletions: function(completions) {
    completions.forEach(completion => {
      const prefixes = this.extractPrefixes(completion);
      this.remove(prefixes, completion);
    });
    return completions.length;
  },

  deleteCompletion: function(completion) {
    this.deleteCompletions([completion]);
    return 1;
  },

  extractPrefixes: function(completion) {
    const prefixes = [];
    for (let i = 1; i <= completion.length; i++) {
      prefixes.push(completion.slice(0, i));
    }
    return prefixes;
  },

  index: function(prefixes, completion, score=0) {
    prefixes.forEach(prefix =>
      this.client.zadd(prefix, score, completion)
    );
  },

  remove: function(prefixes, completion) {
    prefixes.forEach(prefix =>
      this.client.zrem(prefix, completion)
    );
  },

  search: function(prefixQuery) {
    return new Promise((resolve, reject) => {
      this.client.zrange(prefixQuery, 0, -1, (err, reply) => {
        resolve(reply);
      });
    });
  },

  searchWithScores: function(prefixQuery) {
    return new Promise((resolve, reject) => {
      this.client.zrange(prefixQuery, 0, -1, 'WITHSCORES', (err, reply) => {
        resolve(reply);
      });
    });
  },

  top5Suggestions: returnTopXSuggestions(5),
  top3Suggestions: returnTopXSuggestions(3),
  top5SuggestionsWithScores: returnTopXSuggestionsWithScores(5),

  // we increment by -1, bc this enables us to sort
  // by frequency plus ascending lexographical order in Redis
  bumpScore: function(completion) {
    const prefixes = this.extractPrefixes(completion);
    prefixes.forEach(prefix =>
      this.client.zincrby(prefix, -1, completion)
    );
    return;
  },

  setScore: function(completion, score) {
    const prefixes = this.extractPrefixes(completion);
    prefixes.forEach(prefix =>
      this.client.zadd(prefix, score, completion)
    );
  },
};


