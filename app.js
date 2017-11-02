const redis = require("redis");
// TODO: make createClient its own method, in order
// to pass in custom config options
const fs = require("fs");
const path = require("path");

const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const client = redis.createClient();

// later: configuration option - include full string
// also clean up completions before insertCompletionsing
// E.g. normalize case and whitespaces

// path represents a relative path from directory of app.js
// or absolute path
// currently expects array of completions in a json file


// exported functions
module.exports = {
  client: client,
  importFile: function(filePath) {
    let data;
    let dataJson;

    try {
      data = fs.readFileSync(path.resolve(process.cwd(), filePath), "utf-8");
      dataJson = JSON.parse(data);
    } catch (e) {
      console.log(e.message);
      return;
    }

    this.insertCompletions(dataJson);
  },

  insertCompletions: function(completions) {
    if (!Array.isArray(completions)) {
      throw new TypeError(
        `The argument to insertCompletions must be an array`
      );
    }

    completions.forEach(completion => {
      const prefixes = this.extractPrefixes(completion);
      this.index(prefixes, completion);
    });
    return completions.length;
  },

  // takes an array of completions with scores
  // e.g. [{ completion: "string", score: -13 }]
  insertCompletionsWithScores: function(completionsWithScores) {
    if (!Array.isArray(completions)) {
      throw new TypeError(
        `The argument to insertCompletionsWithScores must be an array`
      );
    }

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

  search: function(prefixQuery, opts) {
    const defaultOpts = { limit: 0, withScores: false };
    opts = { ...defaultOpts, ...opts }
    const limit = opts.limit - 1;

    let args = [prefixQuery, 0, limit];
    if (opts.withScores) args = args.concat('WITHSCORES');
    return this.client.zrangeAsync(...args);
  },

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
