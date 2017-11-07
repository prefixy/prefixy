const path = require("path");
const redis = require("redis");
const Prefixy = require(path.resolve(path.dirname(path.dirname(__dirname)), "prefixy"));
const axios = require("axios");
const bluebird = require("bluebird");

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

Prefixy.client = redis.createClient({ db: 1, prefix: "test:" });

axios.defaults.baseURL = "http://localhost:3000";
axios.defaults.headers.common['Accept'] = 'application/json';

describe("putIncrementEndpoint", () => {
  describe("validDataTest", () => {
    const reqBody = {
      completion: "wally"
    };

    beforeEach(async () => {
      await Prefixy.insertCompletions(["wally"]);
    });

    afterEach(() => {
      // Prefixy.client.flushdb();
    });

    it("returns a 204 No Content", async () => {
      const res = await axios.put("/increment", reqBody);
      expect(res.status).toBe(204);
    });

    xit("increments the completion's score by 1", async () => {

    });
  });

  describe("invalidDataTest", () => {
    const reqBody = {
      completion: 9999,
    };

    let res;

    beforeEach(async () => {
      try {
        res = await axios.put("/increment", reqBody);
      } catch(e) {
        res = e.response;
      }
    });

    afterEach(() => {
      Prefixy.client.flushdb();
    });

    it("returns a 400 Bad Request", () => {
      expect(res.status).toBe(400);
    });

    it("returns a json body containing an error message", () => {
      res.data = JSON.stringify(res.data);
      expect(res.data).toMatch(/\{"error":.*\}/);
    });
  });
});
