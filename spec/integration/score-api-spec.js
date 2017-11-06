const redis = require("redis");
const path = require("path");
const Prefixy = require(path.resolve(path.dirname(path.dirname(__dirname)), "prefixy"));
const axios = require("axios");
const bluebird = require("bluebird");

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

Prefixy.client = redis.createClient({ db: 1, prefix: "test:" });

axios.defaults.baseURL = "http://localhost:3000";
axios.defaults.headers.common['Accept'] = 'application/json';

describe("putScoreEndpoint", () => {
  describe("validDataTest", () => {
    const reqBody = {
      completion: "Wally",
      score: 5
    };

    let res;

    beforeEach(async () => {
      res = await axios.put("/score", reqBody);
    });

    afterEach(() => {
      Prefixy.client.flushdb();
    });

    it("returns a 200 OK", () => {
      expect(res.status).toBe(200);
    });

    xit("sets the completion's score in the index", () => {

    });

    it("returns a json body of the updated completion", () => {
      expect(res.data).toEqual(reqBody);
    });
  });

  describe("invalidDataTest", () => {
    const reqBody = {
      completion: "",
      score: true
    };

    let res;

    beforeEach(async () => {
      try {
        res = await axios.put("/score", reqBody);
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
