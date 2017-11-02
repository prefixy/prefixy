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
    let filePath;
    let fileCreated = false;

    const saveFile = data => {
      fs.writeFileSync(filePath, data, "utf8");
      fileCreated = true;
    };

    beforeEach(() => {
      filePath = path.resolve(__dirname, "temp-data.json");
      spyOn(App, "insertCompletions");
    });

    afterEach(() => {
      if (fileCreated) {
        fs.unlinkSync(filePath);
        fileCreated = false;
      }
    });

    it("calls insertCompletions with parsed json data", () => {
      const data = JSON.stringify(["tiff", "wal", "jay"]);
      saveFile(data);

      App.importFile(filePath);

      expect(
        App.insertCompletions
      ).toHaveBeenCalled();
    });

    it("does not call insertCompletions when the path is invalid", () => {
      App.importFile("testtttttttttt-data.json");

      expect(
        App.insertCompletions
      ).not.toHaveBeenCalled();
    });

    it("does not call insertCompletions when the JSON is invalid", () => {
      saveFile("['pikachu' 'bulbasaur' 'gengar']");

      App.importFile(filePath);

      expect(
        App.insertCompletions
      ).not.toHaveBeenCalled();
    });
  });
});
