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

    this.redisUrl = opts.redisUrl;
    this.mongoUrl = opts.mongoUrl;
    this.client = redis.createClient(redisOptions);
    this.mongoClient = mongo.MongoClient;
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

  addTenant(prefix, tenant) {
    return tenant + ":" + prefix;
  }

  quitRedisClient() {
    this.client.quit();
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

  async connectMongo() {
    return this.mongoClient.connect(this.mongoUrl);
  }

  async mongoInsert(prefix, tenant, completions) {
    const args = [{prefix}, {$set: {completions}}, {upsert: true}];
    const db = await this.connectMongo();
    const col = db.collection(tenant);
    col.createIndex({prefix: "text"}, {background: true});
    col.findOneAndUpdate(...args, (err, r) => db.close());
  }

  async mongoDelete(prefix, tenant) {
    const db = await this.connectMongo();
    const col = db.collection(tenant);
    col.findOneAndDelete({prefix}, (err, r) => db.close());
  }

  async mongoFind(prefix, tenant) {
    const db = await this.connectMongo();
    const completions = await db.collection(tenant).find({prefix}).limit(1).toArray();
    db.close();
    if (completions[0]) {
      return completions[0].completions;
    } else {
      return [];
    }
  }

  async mongoLoad(prefix, tenant) {
    const commands = [];
    const completions = await this.mongoFind(prefix, tenant);
    const prefixWithTenant = this.addTenant(prefix, tenant);

    for (var i = 0; i < completions.length; i += 2) {
      commands.push(['zadd', prefixWithTenant, completions[i + 1], completions[i]]);
    }

    return this.client.batch(commands).execAsync();
  }

  async mongoPersist(prefix, tenant) {
    const prefixWithTenant = this.addTenant(prefix, tenant);
    const completions = await this.client.zrangeAsync(prefixWithTenant, 0, -1, 'WITHSCORES');

    if (completions.length === 0) {
      this.mongoDelete(prefix, tenant);
    } else {
      this.mongoInsert(prefix, tenant, completions);
    }
  }

  async persistPrefixes(prefixes, tenant) {
    for (var i = 0; i < prefixes.length; i++) {
      await this.mongoPersist(prefixes[i], tenant);
    }
  }

  async insertCompletion(prefixes, tenant, completion) {
    for (let i = 0; i < prefixes.length; i++) {
      let prefixWithTenant = this.addTenant(prefixes[i], tenant);
      let count = await this.client.zcountAsync(prefixWithTenant, '-inf', '+inf');

      if (count === 0) {
        await this.mongoLoad(prefixes[i], tenant);
      }

      if (count < this.bucketLimit) {
        await this.client.zaddAsync(prefixWithTenant, 'NX', 0, completion);
      }
    }
  }

  async insertCompletions(array, tenant) {
    validateInputIsArray(array, "insertCompletions");

    let allPrefixes = [];

    for (let i = 0; i < array.length; i++) {
      let completion = array[i];
      completion = this.normalizeCompletion(completion);
      const prefixes = this.extractPrefixes(completion);

      allPrefixes = [...allPrefixes, ...prefixes];
      await this.insertCompletion(prefixes, tenant, completion);
    }

    return this.persistPrefixes(allPrefixes, tenant);
  }

  async deleteCompletions(completions, tenant) {
    validateInputIsArray(completions, "deleteCompletions");

    let allPrefixes = [];
    const commands = [];
    completions.forEach(completion => {
      completion = this.normalizeCompletion(completion);
      const prefixes = this.extractPrefixes(completion);
      allPrefixes = [...allPrefixes, ...prefixes];

      prefixes.forEach(prefix => {
        const prefixWithTenant = this.addTenant(prefix, tenant);
        commands.push(["zrem", prefixWithTenant, completion]);
      }, this);
    });

    return this.client.batch(commands).execAsync().then(async () => {
      await this.persistPrefixes(allPrefixes, tenant);
      return "persist success";
    });
  }

  async search(prefixQuery, tenant, opts={}) {
    const defaultOpts = { limit: this.suggestionCount, withScores: false };
    opts = { ...defaultOpts, ...opts }
    const limit = opts.limit - 1;
    const prefix = this.normalizePrefix(prefixQuery);
    const prefixWithTenant = this.addTenant(prefix, tenant);

    let args = [prefixWithTenant, 0, limit];
    if (opts.withScores) args = args.concat('WITHSCORES');

    let result = await this.client.zrangeAsync(...args);

    if (result.length === 0) {
      await this.mongoLoad(prefix, tenant);
      result = await this.client.zrangeAsync(...args);
    }

    return result;
  }

  async increment(completion, tenant) {
    completion = this.normalizeCompletion(completion);
    const prefixes = this.extractPrefixes(completion);
    const commands = [];
    const limit = this.bucketLimit;
    let count;
    let last;

    for (var i = 0; i < prefixes.length; i++) {
      let prefixWithTenant = this.addTenant(prefixes[i], tenant);
      count = await this.client.zcountAsync(prefixWithTenant, '-inf', '+inf');

      if (count === 0) {
        await this.mongoLoad(prefixes[i], tenant);
      }

      if (count >= limit) {
        last = await this.client.zrangeAsync(prefixWithTenant, limit - 1, limit - 1, 'WITHSCORES');
        const newScore = last[1] - 1;
        commands.push(['zremrangebyrank', prefixWithTenant, limit - 1, -1]);
        commands.push(['zadd', prefixWithTenant, newScore, completion]);
      } else {
        commands.push(['zincrby', prefixWithTenant, -1, completion]);
      }
    }

    return this.client.batch(commands).execAsync().then(async () => {
      await this.persistPrefixes(prefixes, tenant);
      return "persist success";
    });
  }
}

module.exports = new Prefixy();
