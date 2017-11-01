const App = require("../../app");

describe("App", () => {
  describe("extractPrefixes", () => {
    it("returns an array of prefixes for a completion", () => {
      expect(
        App.extractPrefixes("waldo")
      ).toEqual(["w", "wa", "wal", "wald", "waldo"]);
    });
  });

  describe("importFile", () => {
    spyOn(App, 'insertCompletions');

    it("calls insertCompletions with parsed json data", () => {

    });
  });
});
