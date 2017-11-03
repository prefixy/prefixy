const redis = require("redis");
const App = require("../../app");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

App.client = redis.createClient({ prefix: "test:" });

describe("App functionality", () => {
  describe("insertCompletions", () => {
    it("inserts completions for each prefix for each completion", async () => {
      await App.insertCompletions(["charizard"]);
      const result = await App.search("c");
      console.log(result);

      expect(result).toContain("charizard");
    });
  });
});
