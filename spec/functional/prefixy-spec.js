const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const path = require("path");
const Prefixy = require(path.resolve(path.dirname(path.dirname(__dirname)), "prefixy"));
Prefixy.client = redis.createClient({ db: 1, prefix: "test:" });

describe("Prefixy works with redis", () => {

  afterEach(() => {
    Prefixy.client.flushdb();
  });

  describe("insertCompletions", () => {
    it("adds completion to all of its prefixes", async () => {
      await Prefixy.insertCompletions(["charizard"]);
      const prefix1 = await Prefixy.search("c");
      const prefix2 = await Prefixy.search("char");
      const prefix3 = await Prefixy.search("charizard");

      expect(prefix1).toContain("charizard");
      expect(prefix2).toContain("charizard");
      expect(prefix3).toContain("charizard");
    });

    it("can add a group of completions", async () => {
      await Prefixy.insertCompletions(["parasect", "jigglypuff", "paras"]);
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

  describe("insertCompletionsWithScores", () => {
    it("adds completion with its score to all of its prefixes", async () => {
      await Prefixy.insertCompletionsWithScores([{ completion: "wigglytuff", score: -20 }]);

      const prefix1 = await Prefixy.search("wi", { withScores: true });
      const prefix2 = await Prefixy.search("wiggly", { withScores: true });
      const prefix3 = await Prefixy.search("wigglytuff", { withScores: true });

      expect(prefix1).toEqual(['wigglytuff', '-20']);
      expect(prefix2).toEqual(['wigglytuff', '-20']);
      expect(prefix3).toEqual(['wigglytuff', '-20']);
    });

    it("can add group of completions with scores", async () => {
      await Prefixy.insertCompletionsWithScores(
        [
          { completion: "eevee", score: -10 },
          { completion: "exeggcute", score: -50 },
          { completion: "igglybuff", score: -5 },
        ]
      );

      const prefix1 = await Prefixy.search("e", { withScores: true });
      const prefix2 = await Prefixy.search("ex", { withScores: true });
      const prefix3 = await Prefixy.search("igg", { withScores: true });

      expect(prefix1).toEqual(['exeggcute', '-50', 'eevee', '-10']);
      expect(prefix2).toEqual(['exeggcute', '-50']);
      expect(prefix3).toEqual(['igglybuff', '-5']);
    });

    it("items inserted with same score are returned lexicographically", async () => {
      await Prefixy.insertCompletionsWithScores(
        [
          { completion: "exeggcute", score: -10 },
          { completion: "eevee", score: -10 },
        ]
      );
      const prefix1 = await Prefixy.search("e");

      expect(prefix1).toEqual(['eevee', 'exeggcute']);
    });
  });

  describe("deleteCompletions", () => {
    it("removes completions from each of their prefixes", async () => {
      await Prefixy.insertCompletions(["geodude", "ghastly", "graveler"]);
      await Prefixy.deleteCompletions(["geodude", "graveler"]);
      const results = await Prefixy.search("g");

      expect(results).toEqual(["ghastly"]);
    });
  });

  describe("bumpScore", () => {
    it("bumps a completion's score by 1", async () => {
      await Prefixy.insertCompletions(["jynx"]);
      await Prefixy.bumpScore("jynx");
      const result = await Prefixy.search("jynx", { withScores: true });

      expect(result).toEqual(["jynx", "-1"]);
    });
  });

  describe("setScore", () => {
    it("inserts/updates a completion with a score", async () => {
      await Prefixy.setScore("haunter", -20);
      const result = await Prefixy.search("h", { withScores: true });

      expect(result).toEqual(["haunter", "-20"]);
    });
  });
});
