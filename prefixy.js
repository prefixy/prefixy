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
    let json;
    let data;

    try {
      json = fs.readFileSync(path.resolve(process.cwd(), filePath), "utf-8");
      data = JSON.parse(json);
    } catch (e) {
      return e.message;
    }

    this.insertCompletions(data);
  },

  // takes an array of strings or an array of completions with scores
  // e.g. [{ completion: "string", score: 13 }]
  insertCompletions: function(array) {
    validateInputIsArray(array, "insertCompletions");

    const commands = [];
    array.forEach(item => {
      const completion = item.completion || item;
      const score = item.score || 0;
      const prefixes = this.extractPrefixes(completion);

      prefixes.forEach(prefix =>
        commands.push(['zadd', prefix, -score, completion])
      );
    });

    return this.client.batch(commands).execAsync();
  },

  deleteCompletions: function(completions) {
    validateInputIsArray(completions, "deleteCompletions");

    const commands = [];
    completions.forEach(completion => {
      const prefixes = this.extractPrefixes(completion);

      prefixes.forEach(prefix =>
        commands.push(["zrem", prefix, completion])
      );
    });

    return this.client.batch(commands).execAsync();
  },

  extractPrefixes: function(completion) {
    const prefixes = [];
    completion = completion.toLowerCase();
    for (let i = 1; i <= completion.length; i++) {
      prefixes.push(completion.slice(0, i));
    }
    return prefixes;
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
  dynamicIncrementScore: function(completion, limit) {
    if (limit >= 0) {
      return this.dynamicBucketIncrementScore(completion, limit);
    }

    const prefixes = this.extractPrefixes(completion);
    const commands = prefixes.map(prefix =>
      ['zincrby', prefix, -1, completion]
    );

    return this.client.batch(commands).execAsync();
  },

  dynamicBucketIncrementScore: async function(completion, limit) {
    const prefixes = this.extractPrefixes(completion);
    const commands = [];
    let count;
    let last;

    for (var i = 0; i < prefixes.length; i++) {
      count = await this.client.zcountAsync(prefixes[i], '-inf', '+inf');

      if (count >= limit) {
        last = await this.client.zrangeAsync(prefixes[i], limit - 1, limit - 1, 'WITHSCORES');
        newScore = last[1] - 1;
        commands.push(['zremrangebyrank', prefixes[i], limit - 1, -1]);
        commands.push(['zadd', prefixes[i], newScore, completion]);
      } else {
        commands.push(['zincrby', prefixes[i], -1, completion]);
      }
    }

    return this.client.batch(commands).execAsync();
  },
};
