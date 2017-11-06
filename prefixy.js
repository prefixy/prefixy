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

// path represents a relative path from directory of app.js
// or absolute path
// currently expects array of completions in a json file

const validateInputIsArray = (input, funcName) => {
  if (!Array.isArray(input)) {
    throw new TypeError(
      `The argument to ${funcName} must be an array`
    );
  }
};

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
      return e.message;
    }

    this.insertCompletions(dataJson);
  },

  insertCompletions: function(completions) {
    validateInputIsArray(completions, "insertCompletions");

    const indexes = [];
    completions.forEach(completion => {
      const prefixes = this.extractPrefixes(completion);
      indexes.push(this.index(prefixes, completion));
    });
    return Promise.all(indexes);
  },

  // takes an array of completions with scores
  // e.g. [{ completion: "string", score: -13 }]
  insertCompletionsWithScores: function(completionsWithScores) {
    validateInputIsArray(completionsWithScores, "insertCompletionsWithScores");

    const indexes = [];
    completionsWithScores.forEach(item => {
      const prefixes = this.extractPrefixes(item.completion);
      indexes.push(this.index(prefixes, item.completion, item.score));
    });
    return Promise.all(indexes);
  },

  deleteCompletions: function(completions) {
    validateInputIsArray(completions, "deleteCompletions");

    const removals = [];
    completions.forEach(completion => {
      const prefixes = this.extractPrefixes(completion);
      removals.push(this.remove(prefixes, completion));
    });
    return Promise.all(removals);
  },

  extractPrefixes: function(completion) {
    const prefixes = [];
    completion = completion.toLowerCase();
    for (let i = 1; i <= completion.length; i++) {
      prefixes.push(completion.slice(0, i));
    }
    return prefixes;
  },

  index: function(prefixes, completion, score=0) {
    const commands = prefixes.map(prefix =>
      ['zadd', prefix, score, completion]
    );

    return this.client.batch(commands).execAsync();
  },

  remove: function(prefixes, completion) {
    const commands = prefixes.map(prefix =>
      ['zrem', prefix, completion]
    );

    return this.client.batch(commands).execAsync();
  },

  search: function(prefixQuery, opts={}) {
    const defaultOpts = { limit: 0, withScores: false };
    opts = { ...defaultOpts, ...opts }
    const limit = opts.limit - 1;

    let args = [prefixQuery.toLowerCase(), 0, limit];
    if (opts.withScores) args = args.concat('WITHSCORES');
    return this.client.zrangeAsync(...args);
  },

  // we increment by -1, bc this enables us to sort
  // by frequency plus ascending lexographical order in Redis
  fixedIncrementScore: function(completion) {
    const prefixes = this.extractPrefixes(completion);
    const commands = prefixes.map(prefix =>
      ['zadd', prefix, 'XX', 'INCR', -1, completion]
    );

    return this.client.batch(commands).execAsync();
  },

  // similar to fixedIncrementScore, but will add completion
  // to bucket if not present
  dynamicIncrementScore: function(completion) {
    const prefixes = this.extractPrefixes(completion);
    const commands = prefixes.map(prefix =>
      ['zincrby', prefix, -1, completion]
    );

    return this.client.batch(commands).execAsync();
  },

  setScore: function(completion, score) {
    const prefixes = this.extractPrefixes(completion);
    const commands = prefixes.map(prefix =>
      ['zadd', prefix, score, completion]
    );

    return this.client.batch(commands).execAsync();
  },
};
