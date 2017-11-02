const App = require("../../app");
const path = require("path");
const fs = require("fs");

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
      const filePath = path.resolve(__dirname, "valid-data.json");
      fs.writeFileSync(filePath, JSON.stringify(
        ["tiffany han", "walid wahed", "jay shenk"]
      ), "utf8");

      spyOn(App, "insertCompletions");
      App.importFile(filePath);
      expect(
        App.insertCompletions
      ).toHaveBeenCalled();

      fs.unlinkSync(filePath);
    });

    it("does not call insertCompletions when the path is invalid", () => {
      spyOn(App, "insertCompletions");
      App.importFile("spec/testtttttttttt-data.json");

      expect(
        App.insertCompletions
      ).not.toHaveBeenCalled();
    });
  });
});
