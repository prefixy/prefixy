const redis = require("redis");
// TODO: make createClient its own method, in order
// to pass in custom config options
const fs = require("fs");
const path = require("path");
const JSONStream = require("JSONStream");
const { Transform } = require("stream");
const { spawn } = require("child_process");
const { logMemory } = require(path.resolve(__dirname, "utils"));

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

const byteSize = (str) => {
  return String(Buffer.byteLength(String(str), "utf8"));
};

const toRedisProtocol = (command) => {
  let protocol = "";
  protocol += "*" + String(command.length) + "\r\n"
  command.forEach(arg => {
    protocol += "$" + byteSize(arg) + "\r\n";
    protocol += String(arg) + "\r\n";
  });
  // console.log(protocol);
  return protocol;
};

const translator = new Transform({
  objectMode: true,

  transform(item, encoding, callback) {
    const completion = item.completion || item;
    const score = item.score || 0;
    const prefixes = this.extractPrefixes(completion);

    let chunk = "";
    // logging fn here
    prefixes.forEach(prefix =>
      chunk += toRedisProtocol(['zadd', prefix, -score, completion])
    );

    callback(null, chunk);
  }
});

// exported functions
module.exports = {
  client: client,

  extractPrefixes: function(completion) {
    const prefixes = [];
    completion = completion.toLowerCase();
    for (let i = 1; i <= completion.length; i++) {
      prefixes.push(completion.slice(0, i));
    }
    return prefixes;
  },

  importFile: function(filePath) {
    const json = fs.createReadStream(path.resolve(process.cwd(), filePath), "utf8");
    const parser = JSONStream.parse("*");
    const redis = spawn("redis-cli", ["--pipe"],
      { stdio: ["pipe", process.stdout, process.stderr] });

    // const file = fs.createWriteStream(path.resolve(__dirname, "sample-data/protocol.txt"), {"flags": "a"});
    // json.pipe(parser).pipe(this.ts).pipe(file);

    json.pipe(parser).pipe(translator).pipe(redis.stdin);
  },

  // takes an array of strings or an array of completions with scores
  // e.g. [{ completion: "string", score: 13 }]
  insertCompletions: function(array) {
    // validateInputIsArray(array, "insertCompletions");
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
};
