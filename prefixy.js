const redis = require("redis");
// TODO: make createClient its own method, in order
// to pass in custom config options
const fs = require("fs");
const path = require("path");
const JSONStream = require("JSONStream");
const { Writer } = require(path.resolve(__dirname, "prefixyHelpers/Streamables"));
const { extractPrefixes } = require(path.resolve(__dirname, "prefixyHelpers/utils"));
const bluebird = require("bluebird");

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

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

class Prefixy {
  constructor() {}

  async invoke(cb) {
    this.client = redis.createClient();
    let result;

    try {
      result = await cb();
    } catch(e) {
      console.log(e);
    }

    this.client.quit();
    return result;
  }

  importFile(filePath) {
    const json = fs.createReadStream(path.resolve(process.cwd(), filePath), "utf8");
    const parser = JSONStream.parse("*");
    // const translator = new Translator(this);
    const writer = new Writer(this);

    const promise = new Promise((resolve, reject) => {
      json.pipe(parser).pipe(writer);
      writer.on("finish", () => resolve("Import finished"));
    });
    return promise;
  }

  // takes an array of strings or an array of completions with scores
  // e.g. [{ completion: "string", score: 13 }]
  insertCompletions(array) {
    validateInputIsArray(array, "insertCompletions");

    const commands = [];
    array.forEach(item =>
      commands.push(...this.commandsToAddCompletion(item))
    );

    return this.client.batch(commands).execAsync();
  }

  commandsToAddCompletion(item) {
    const completion = item.completion || item;
    const score = item.score || 0;
    const prefixes = extractPrefixes(completion);

    let commands = [];
    prefixes.forEach(prefix =>
      commands.push(['zadd', prefix, -score, completion])
    );

    return commands;
  }

  deleteCompletions(completions) {
    validateInputIsArray(completions, "deleteCompletions");

    const commands = [];
    completions.forEach(completion => {
      const prefixes = extractPrefixes(completion);

      prefixes.forEach(prefix =>
        commands.push(["zrem", prefix, completion])
      );
    });

    return this.client.batch(commands).execAsync();
  }

  search(prefixQuery, opts={}) {
    const defaultOpts = { limit: 0, withScores: false };
    opts = { ...defaultOpts, ...opts }
    const limit = opts.limit - 1;

    let args = [prefixQuery.toLowerCase(), 0, limit];
    if (opts.withScores) args = args.concat('WITHSCORES');
    return this.client.zrangeAsync(...args);
  }

  // we increment by -1, bc this enables us to sort
  // by frequency plus ascending lexographical order in Redis
  fixedIncrementScore(completion) {
    const prefixes = extractPrefixes(completion);
    const commands = prefixes.map(prefix =>
      ['zadd', prefix, 'XX', 'INCR', -1, completion]
    );

    return this.client.batch(commands).execAsync();
  }

  // similar to fixedIncrementScore, but will add completion
  // to bucket if not present

  dynamicIncrementScore(completion, limit) {
    if (limit >= 0) {
      return this.dynamicBucketIncrementScore(completion, limit);
    }

    const prefixes = extractPrefixes(completion);
    const commands = prefixes.map(prefix =>
      ['zincrby', prefix, -1, completion]
    );

    return this.client.batch(commands).execAsync();
  }

  async dynamicBucketIncrementScore(completion, limit) {
    const prefixes = extractPrefixes(completion);
    const commands = [];
    let count;
    let last;

    for (var i = 0; i < prefixes.length; i++) {
      count = await this.client.zcountAsync(prefixes[i], '-inf', '+inf');
      let newScore;

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
  }
}

module.exports = new Prefixy();

