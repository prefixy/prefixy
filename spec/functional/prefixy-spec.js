const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const fs = require("fs");
const path = require("path");
const Prefixy = require(path.resolve(path.dirname(path.dirname(__dirname)), "prefixy"));

Prefixy.client = redis.createClient({ db: 1 });
Prefixy.mongoUrl = "mongodb://localhost:27017/test";

describe("Prefixy works with redis", () => {
  const tenant = "func-test";

  afterEach(() => {
    Prefixy.client.flushdb();
  });

  describe("inserting completions", () => {
    it("adds completion to all of its prefixes", async () => {
      const completions = ["charizard"];
      await Prefixy.insertCompletions(completions, tenant);
      const prefix1 = await Prefixy.search("c", tenant);
      const prefix2 = await Prefixy.search("char", tenant);
      const prefix3 = await Prefixy.search("charizard", tenant);

      expect(prefix1).toContain("charizard");
      expect(prefix2).toContain("charizard");
      expect(prefix3).toContain("charizard");

      await Prefixy.deleteCompletions(completions, tenant);
    });

    it("can add a group of completions", async () => {
      const completions = ["parasect", "jigglypuff", "paras"];
      await Prefixy.insertCompletions(completions, tenant);
      const prefixP      = await Prefixy.search("p", tenant);
      const prefixPa     = await Prefixy.search("pa", tenant);
      const prefixJ      = await Prefixy.search("j", tenant);
      const prefixJiggly = await Prefixy.search("jiggly", tenant);
      const prefixParas  = await Prefixy.search("paras", tenant);
      const prefixParase = await Prefixy.search("parase", tenant);

      expect(prefixP).toEqual(["paras", "parasect"]);
      expect(prefixPa).toEqual(["paras", "parasect"]);
      expect(prefixJ).toEqual(["jigglypuff"]);
      expect(prefixJiggly).toEqual(["jigglypuff"]);
      expect(prefixParas).toEqual(["paras", "parasect"]);
      expect(prefixParase).toEqual(["parasect"]);

      await Prefixy.deleteCompletions(completions, tenant);
    });

    it("can add strings containing special characters", async () => {
      const completion = "!@#$!@!#  !#@!/\\";
      const normalizedCompletion = Prefixy.normalizeCompletion(completion);
      await Prefixy.insertCompletions([completion], tenant);
      const prefix1 = await Prefixy.search("!@", tenant);
      const prefix2 = await Prefixy.search("!@#$!@!#  ", tenant);
      const prefix3 = await Prefixy.search("!@#$!@!#  !", tenant);
      const prefix4 = await Prefixy.search("!@#$!@!#  !#@!/\\", tenant);

      expect(prefix1).toEqual([normalizedCompletion]);
      expect(prefix2).toEqual([normalizedCompletion]);
      expect(prefix3).toEqual([normalizedCompletion]);
      expect(prefix4).toEqual([normalizedCompletion]);
    });
  });

  describe("deleteCompletions", () => {
    it("removes completions from each of their prefixes", async () => {
      await Prefixy.insertCompletions(["geodude", "ghastly", "graveler"], tenant);
      await Prefixy.deleteCompletions(["geodude", "graveler"], tenant);
      const results = await Prefixy.search("g", tenant);

      expect(results).toEqual(["ghastly"]);

      Prefixy.deleteCompletions(["ghastly"], tenant);
    });
  });
});
