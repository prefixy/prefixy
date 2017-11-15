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

    this.redisUrl = opts.redisUrl;
    this.mongoUrl = opts.mongoUrl;
    this.tenant = opts.tenant;
    this.maxMemory = opts.maxMemory;
    this.suggestionCount = opts.suggestionCount;
    this.minChars = opts.minChars;
    this.bucketLimit = opts.bucketLimit;
    this.mongoClient = mongo.MongoClient;
  }

  static defaultOpts() {
    return {
      redisUrl: "redis://127.0.0.1:6379/0",
      mongoUrl: "mongodb://localhost:27017/prefixy",
      tenant: "tenant",
      maxMemory: 500,
      suggestionCount: 5,
      minChars: 1,
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

  async invoke(cb) {
    this.client = redis.createClient({ url: this.redisUrl, prefix: this.tenant + ":" });

    return cb()
      .then((result) => {
        this.client.quit();
        return result;
      });
  }

  extractPrefixes(completion) {
    completion = completion.toLowerCase();

    const start = this.minChars;
    const prefixes = [];
    for (let i = start; i <= completion.length; i++) {
      prefixes.push(completion.slice(0, i));
    }
    return prefixes;
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
      commands.push(['zadd', prefix, completions[i + 1], completions[i]]);
    }

    return this.client.batch(commands).execAsync();
  }

  async mongoPersist(prefix) {
    const completions = await this.client.zrangeAsync(prefix, 0, -1, 'WITHSCORES');

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
        await this.client.zaddAsync(prefixes[i], 'NX', 0, completion);
      }
    }
  }

  async insertCompletions(array) {
    validateInputIsArray(array, "insertCompletions");

    let allPrefixes = [];

    for (let i = 0; i < array.length; i++) {
      let completion = array[i];
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
      const prefixes = this.extractPrefixes(completion);
      allPrefixes = [...allPrefixes, ...prefixes];

      prefixes.forEach(prefix =>
        commands.push(["zrem", prefix, completion])
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

    let args = [prefixQuery.toLowerCase(), 0, limit];
    if (opts.withScores) args = args.concat('WITHSCORES');

    let result = await this.client.zrangeAsync(...args);

    if (result.length === 0) {
      await this.mongoLoad(prefixQuery);
      result = await this.client.zrangeAsync(...args);
    }

    return result;
  }

  async increment(completion) {
    const prefixes = this.extractPrefixes(completion);
    const commands = [];
    const limit = this.bucketLimit;
    let count;
    let last;

    for (var i = 0; i < prefixes.length; i++) {
      count = await this.client.zcountAsync(prefixes[i], '-inf', '+inf');

      if (count === 0) {
        await this.mongoLoad(prefixes[i]);
      }

      if (count >= limit) {
        last = await this.client.zrangeAsync(prefixes[i], limit - 1, limit - 1, 'WITHSCORES');
        const newScore = last[1] - 1;
        commands.push(['zremrangebyrank', prefixes[i], limit - 1, -1]);
        commands.push(['zadd', prefixes[i], newScore, completion]);
      } else {
        commands.push(['zincrby', prefixes[i], -1, completion]);
      }
    }

    return this.client.batch(commands).execAsync().then(async () => {
      await this.persistPrefixes(prefixes);
      return "persist success";
    });
  }
}

module.exports = new Prefixy();
