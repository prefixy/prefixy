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
    it("calls insertCompletions with parsed json data", () => {
      spyOn(App, "insertCompletions");
      App.importFile("spec/test-data.json");
      expect(
        App.insertCompletions
      ).toHaveBeenCalled();
    });

    it("throws a TypeError when the path is invalid", () => {
      expect(
        () => { App.importFile("spec/testtttt-data.json") }
      ).toThrowError(TypeError);
    });
  });
});
