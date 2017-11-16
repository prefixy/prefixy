const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const fs = require("fs");
const path = require("path");
const Prefixy = require(path.resolve(path.dirname(path.dirname(__dirname)), "prefixy"));

Prefixy.client = redis.createClient({ db: 1, prefix: "test:" });
Prefixy.mongoUrl = "mongodb://localhost:27017/test";

describe("Prefixy works with redis", () => {

  afterEach(() => {
    Prefixy.client.flushdb();
  });

  describe("inserting completions", () => {
    it("adds completion to all of its prefixes", async () => {
      const completions = ["charizard"];
      await Prefixy.insertCompletions(completions);
      const prefix1 = await Prefixy.search("c");
      const prefix2 = await Prefixy.search("char");
      const prefix3 = await Prefixy.search("charizard");

      expect(prefix1).toContain("charizard");
      expect(prefix2).toContain("charizard");
      expect(prefix3).toContain("charizard");

      await Prefixy.deleteCompletions(completions);
    });

    it("can add a group of completions", async () => {
      const completions = ["parasect", "jigglypuff", "paras"];
      await Prefixy.insertCompletions(completions);
      const prefixP      = await Prefixy.search("p");
      const prefixPa     = await Prefixy.search("pa");
      const prefixJ      = await Prefixy.search("j");
      const prefixJiggly = await Prefixy.search("jiggly");
      const prefixParas  = await Prefixy.search("paras");
      const prefixParase = await Prefixy.search("parase");

      expect(prefixP).toEqual(["paras", "parasect"]);
      expect(prefixPa).toEqual(["paras", "parasect"]);
      expect(prefixJ).toEqual(["jigglypuff"]);
      expect(prefixJiggly).toEqual(["jigglypuff"]);
      expect(prefixParas).toEqual(["paras", "parasect"]);
      expect(prefixParase).toEqual(["parasect"]);

      await Prefixy.deleteCompletions(completions);
    });

    it("can add strings containing special characters", async () => {
      await Prefixy.insertCompletions(["!@#$!@!#  !#@!/\\"]);
      const prefix1 = await Prefixy.search("!@");
      const prefix2 = await Prefixy.search("!@#$!@!#  ");
      const prefix3 = await Prefixy.search("!@#$!@!#  !");
      const prefix4 = await Prefixy.search("!@#$!@!#  !#@!/\\");

      expect(prefix1).toEqual(["!@#$!@!#  !#@!/\\"]);
      expect(prefix2).toEqual(["!@#$!@!#  !#@!/\\"]);
      expect(prefix3).toEqual(["!@#$!@!#  !#@!/\\"]);
      expect(prefix4).toEqual(["!@#$!@!#  !#@!/\\"]);
    });
  });

  describe("deleteCompletions", () => {
    it("removes completions from each of their prefixes", async () => {
      await Prefixy.insertCompletions(["geodude", "ghastly", "graveler"]);
      await Prefixy.deleteCompletions(["geodude", "graveler"]);
      const results = await Prefixy.search("g");

      expect(results).toEqual(["ghastly"]);

      Prefixy.deleteCompletions(["ghastly"]);
    });
  });
});
