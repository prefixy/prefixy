const axios = require("axios");
axios.defaults.baseURL = "http://localhost:3000";
axios.defaults.headers.common['Accept'] = 'application/json';

describe("putIncrementEndpoint", () => {
  describe("validDataTest", () => {
    const reqBody = {
      completion: "Wally"
    };

    it("returns a 204 No Content", async () => {
      const res = await axios.put("/increment", reqBody);
      expect(res.status).toBe(204);
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

    it("returns a 400 Bad Request", () => {
      expect(res.status).toBe(400);
    });

    it("returns a json body containing an error message", () => {
      res.data = JSON.stringify(res.data);
      expect(res.data).toMatch(/\{"error":.*\}/);
    });
  });
});
