const redis = require("redis");
const mongo = require('mongodb');
const fs = require("fs");
const path = require("path");
const JSONStream = require("JSONStream");
const { Writer } = require(path.resolve(__dirname, "prefixyHelpers/Streamables"));
const bluebird = require("bluebird");

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const CONFIG_FILE = path.resolve(__dirname, "prefixy-config.json");

const validateInputIsArray = (input, funcName) => {
  if (!Array.isArray(input)) {
    throw new TypeError(
      `The argument to ${funcName} must be an array`
    );
  }
};

class Prefixy {
  constructor() {
    const opts = Prefixy.parseOpts();
    const redisOptions = {
      url: opts.redisUrl, 
      retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          // End reconnecting on a specific error and flush all commands with
          // a individual error
          return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          // End reconnecting after a specific timeout and flush all commands
          // with a individual error
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          // End reconnecting with built in error
          return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
      },
    }

    console.log("prefixy object instantiated");

    this.redisUrl = opts.redisUrl;
    this.mongoUrl = opts.mongoUrl;
    this.client = redis.createClient(redisOptions);
    this.mongoClient = mongo.MongoClient;
    this.tenant = opts.tenant;
    this.maxMemory = opts.maxMemory;
    this.suggestionCount = opts.suggestionCount;
    this.prefixMinChars = opts.prefixMinChars;
    this.prefixMaxChars = opts.prefixMaxChars;
    this.completionMaxChars = opts.completionMaxChars;
    this.bucketLimit = opts.bucketLimit;
  }

  static defaultOpts() {
    return {
      redisUrl: process.env.REDIS_URL,
      mongoUrl: process.env.MONGODB_URI,
      tenant: "tenant",
      maxMemory: 500,
      suggestionCount: 5,
      prefixMinChars: 1,
      prefixMaxChars: 15,
      completionMaxChars: 50,
      bucketLimit: 50
    };
  }

  static parseOpts() {
    let opts = {};

    try {
      opts = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    } catch(e) {}

    return { ...this.defaultOpts(), ...opts };
  }

  updateTenantConfig(tenant) {
    let opts = {};

    try {
      opts = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    } catch(e) {}

    opts = { ...opts, tenant};

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(opts), "utf8");
  }

  async invoke(cb) {
    return cb()
      .then((result) => {
        return result;
      }).catch(err => { 
        console.log(err.message);
        err.message = "Internal Server Error";
        throw err; 
      });
  }

  normalizePrefix(string) {
    string = string.slice(0, this.prefixMaxChars);
    string = string.toLowerCase();
    string = string.replace(/\s{2,}/g, " "); // remove instances of more than one whitespace
    return string;
  }

  normalizeCompletion(string) {
    string = string.slice(0, this.completionMaxChars);
    string = string.toLowerCase();
    string = string.trim();
    string = string.replace(/\s{2,}/g, " "); // remove instances of more than one whitespace
    return string;
  }

  extractPrefixes(completion) {
    completion = this.normalizePrefix(completion);

    const start = this.prefixMinChars;
    const prefixes = [];
    for (let i = start; i <= completion.length; i++) {
      prefixes.push(completion.slice(0, i));
    }
    return prefixes;
  }

  addTenant(prefix) {
    return this.tenant + ":" + prefix;
  }

  importFile(filePath) {
    const json = fs.createReadStream(path.resolve(process.cwd(), filePath), "utf8");
    const parser = JSONStream.parse("*");
    const writer = new Writer(this);

    const promise = new Promise((resolve, reject) => {
      json.pipe(parser).pipe(writer);
      writer.on("finish", () => resolve("Import finished"));
    });
    return promise;
  }

  async mongoInsert(prefix, completions) {
    const args = [{prefix}, {$set: {completions}}, {upsert: true}];
    const db = await this.mongoClient.connect(this.mongoUrl);
    const col = db.collection(this.tenant);
    col.createIndex({prefix: "text"}, {background: true});
    col.findOneAndUpdate(...args, (err, r) => db.close());
  }

  async mongoDelete(prefix) {
    const db = await this.mongoClient.connect(this.mongoUrl);
    const col = db.collection(this.tenant);
    col.findOneAndDelete({prefix}, (err, r) => db.close());
  }

  async mongoFind(prefix) {
    const db = await this.mongoClient.connect(this.mongoUrl);
    const completions = await db.collection(this.tenant).find({prefix}).limit(1).toArray();
    db.close();
    if (completions[0]) {
      return completions[0].completions;
    } else {
      return [];
    }
  }

  async mongoLoad(prefix) {
    const commands = [];
    const completions = await this.mongoFind(prefix);

    for (var i = 0; i < completions.length; i += 2) {
      commands.push(['zadd', this.addTenant(prefix), completions[i + 1], completions[i]]);
    }

    return this.client.batch(commands).execAsync();
  }

  async mongoPersist(prefix) {
    const completions = await this.client.zrangeAsync(this.addTenant(prefix), 0, -1, 'WITHSCORES');

    if (completions.length === 0) {
      this.mongoDelete(prefix);
    } else {
      this.mongoInsert(prefix, completions);
    }
  }

  async persistPrefixes(prefixes) {
    for (var i = 0; i < prefixes.length; i++) {
      await this.mongoPersist(prefixes[i]);
    }
  }

  async insertCompletion(prefixes, completion) {
    for (let i = 0; i < prefixes.length; i++) {
      let count = await this.client.zcountAsync(prefixes[i], '-inf', '+inf');

      if (count === 0) {
        await this.mongoLoad(prefixes[i]);
      }

      if (count < this.bucketLimit) {
        await this.client.zaddAsync(this.addTenant(prefixes[i]), 'NX', 0, completion);
      }
    }
  }

  async insertCompletions(array) {
    validateInputIsArray(array, "insertCompletions");

    let allPrefixes = [];

    for (let i = 0; i < array.length; i++) {
      let completion = array[i];
      completion = this.normalizeCompletion(completion);
      const prefixes = this.extractPrefixes(completion);

      allPrefixes = [...allPrefixes, ...prefixes];
      await this.insertCompletion(prefixes, completion);
    }

    return this.persistPrefixes(allPrefixes);
  }

  async deleteCompletions(completions) {
    validateInputIsArray(completions, "deleteCompletions");

    let allPrefixes = [];
    const commands = [];
    completions.forEach(completion => {
      completion = this.normalizeCompletion(completion);
      const prefixes = this.extractPrefixes(completion);
      allPrefixes = [...allPrefixes, ...prefixes];

      prefixes.forEach(prefix =>
        commands.push(["zrem", this.addTenant(prefix), completion])
      );
    });

    return this.client.batch(commands).execAsync().then(async () => {
      await this.persistPrefixes(allPrefixes);
      return "persist success";
    });
  }

  async search(prefixQuery, opts={}) {
    const defaultOpts = { limit: this.suggestionCount, withScores: false };
    opts = { ...defaultOpts, ...opts }
    const limit = opts.limit - 1;

    let args = [this.addTenant(this.normalizePrefix(prefixQuery)), 0, limit];
    if (opts.withScores) args = args.concat('WITHSCORES');

    let result = await this.client.zrangeAsync(...args);

    if (result.length === 0) {
      await this.mongoLoad(prefixQuery);
      console.log(args);
      result = await this.client.zrangeAsync(...args);
    }

    return result;
  }

  async increment(completion) {
    completion = this.normalizeCompletion(completion);
    const prefixes = this.extractPrefixes(completion);
    const commands = [];
    const limit = this.bucketLimit;
    let count;
    let last;
    let prefix;

    for (var i = 0; i < prefixes.length; i++) {
      prefix = this.addTenant(prefixes[i]); // for redis, not mongo
      count = await this.client.zcountAsync(prefix, '-inf', '+inf');

      if (count === 0) {
        await this.mongoLoad(prefixes[i]);
      }

      if (count >= limit) {
        last = await this.client.zrangeAsync(prefix, limit - 1, limit - 1, 'WITHSCORES');
        const newScore = last[1] - 1;
        commands.push(['zremrangebyrank', prefix, limit - 1, -1]);
        commands.push(['zadd', prefix, newScore, completion]);
      } else {
        commands.push(['zincrby', prefix, -1, completion]);
      }
    }

    return this.client.batch(commands).execAsync().then(async () => {
      await this.persistPrefixes(prefixes);
      return "persist success";
    });
  }
}

module.exports = new Prefixy();
