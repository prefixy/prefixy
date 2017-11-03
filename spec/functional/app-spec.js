const redis = require("redis");
const App = require("../../app");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

App.client = redis.createClient({ db: 1, prefix: "test:" });

describe("App works with redis", () => {

  afterEach(() => {
    App.client.flushdb();
  });

  describe("insertCompletions", () => {
    it("adds completion to all of its prefixes", async () => {
      await App.insertCompletions(["charizard"]);
      const prefix1 = await App.search("c");
      const prefix2 = await App.search("char");
      const prefix3 = await App.search("charizard");

      expect(prefix1).toContain("charizard");
      expect(prefix2).toContain("charizard");
      expect(prefix3).toContain("charizard");
    });

    it("can add a group of completions", async () => {
      await App.insertCompletions(["parasect", "jigglypuff", "paras"]);
      const prefixP      = await App.search("p");
      const prefixPa     = await App.search("pa");
      const prefixJ      = await App.search("j");
      const prefixJiggly = await App.search("jiggly");
      const prefixParas  = await App.search("paras");
      const prefixParase = await App.search("parase");

      expect(prefixP).toEqual(["paras", "parasect"]);
      expect(prefixPa).toEqual(["paras", "parasect"]);
      expect(prefixJ).toEqual(["jigglypuff"]);
      expect(prefixJiggly).toEqual(["jigglypuff"]);
      expect(prefixParas).toEqual(["paras", "parasect"]);
      expect(prefixParase).toEqual(["parasect"]);
    });

    it("can add strings containing special characters", async () => {
      await App.insertCompletions(["!@#$!@!#  !#@!/\\"]);
      const prefix1 = await App.search("!@");
      const prefix2 = await App.search("!@#$!@!#  ");
      const prefix3 = await App.search("!@#$!@!#  !");
      const prefix4 = await App.search("!@#$!@!#  !#@!/\\");

      expect(prefix1).toEqual(["!@#$!@!#  !#@!/\\"]);
      expect(prefix2).toEqual(["!@#$!@!#  !#@!/\\"]);
      expect(prefix3).toEqual(["!@#$!@!#  !#@!/\\"]);
      expect(prefix4).toEqual(["!@#$!@!#  !#@!/\\"]);
    });
  });

  describe("insertCompletionsWithScores", () => {
    it("adds completion with its score to all of its prefixes", async () => {
      await App.insertCompletionsWithScores([{ completion: "wigglytuff", score: -20 }]);

      const prefix1 = await App.search("wi", { withScores: true });
      const prefix2 = await App.search("wiggly", { withScores: true });
      const prefix3 = await App.search("wigglytuff", { withScores: true });

      expect(prefix1).toEqual(['wigglytuff', '-20']);
      expect(prefix2).toEqual(['wigglytuff', '-20']);
      expect(prefix3).toEqual(['wigglytuff', '-20']);
    });

    it("can add group of completions with scores", async () => {
      await App.insertCompletionsWithScores(
        [
          { completion: "eevee", score: -10 },
          { completion: "exeggcute", score: -50 },
          { completion: "igglybuff", score: -5 },
        ]
      );

      const prefix1 = await App.search("e", { withScores: true });
      const prefix2 = await App.search("ex", { withScores: true });
      const prefix3 = await App.search("igg", { withScores: true });

      expect(prefix1).toEqual(['exeggcute', '-50', 'eevee', '-10']);
      expect(prefix2).toEqual(['exeggcute', '-50']);
      expect(prefix3).toEqual(['igglybuff', '-5']);
    });

    it("items inserted with same score are returned lexicographically", async () => {
      await App.insertCompletionsWithScores(
        [
          { completion: "exeggcute", score: -10 },
          { completion: "eevee", score: -10 },
        ]
      );
      const prefix1 = await App.search("e");

      expect(prefix1).toEqual(['eevee', 'exeggcute']);
    });
  });

  describe("deleteCompletions", () => {
    it("removes completions from each of their prefixes", async () => {
      await App.insertCompletions(["geodude", "ghastly", "graveler"]);
      await App.deleteCompletions(["geodude", "graveler"]);
      const results = await App.search("g");

      expect(results).toEqual(["ghastly"]);
    });
  });

  describe("bumpScore", () => {
    it("bumps a completion's score by 1", async () => {
      await App.insertCompletions(["jynx"]);
      await App.bumpScore("jynx");
      const result = await App.search("jynx", { withScores: true });

      expect(result).toEqual(["jynx", "-1"]);
    });
  });

  describe("setScore", () => {
    it("inserts/updates a completion with a score", async () => {
      await App.setScore("haunter", -20);
      const result = await App.search("h", { withScores: true });

      expect(result).toEqual(["haunter", "-20"]);
    });
  });

  // write failing test for case
});

// App.client.flushdb();
// App.client.quit();
