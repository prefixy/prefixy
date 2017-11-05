const axios = require("axios");
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

    it("returns a 200 OK", () => {
      expect(res.status).toBe(200);
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

    it("returns a 400 Bad Request", () => {
      expect(res.status).toBe(400);
    });

    it("returns a json body containing an error message", () => {
      res.data = JSON.stringify(res.data);
      expect(res.data).toMatch(/\{"error":.*\}/);
    });
  });
});
