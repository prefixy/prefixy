const App = require("../../prefixy");
const path = require("path");
const fs = require("fs");

describe("App", () => {
  describe("extractPrefixes", () => {
    it("returns an array of prefixes for a completion", () => {
      expect(
        App.extractPrefixes("waldo")
      ).toEqual(["w", "wa", "wal", "wald", "waldo"]);
    });

    it("extracts the lower case prefixes of a completion", () => {
      expect(
        App.extractPrefixes("Mr. Mime")
      ).toEqual(["m", "mr", "mr.", "mr. ", "mr. m",
                 "mr. mi", "mr. mim", "mr. mime"]);
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

  describe("search", () => {
    beforeEach(() => {
      spyOn(App.client, "zrangeAsync");
    });

    it("calls zrangeAsync", () => {
      App.search("wo");

      expect(
        App.client.zrangeAsync
      ).toHaveBeenCalled();
    });

    it("calls zrangeAsync with correct arguments", () => {
      App.search("wo");

      expect(
        App.client.zrangeAsync
      ).toHaveBeenCalledWith("wo", 0, -1);
    });

    it("calls zrangeAsync with the options provided to search", () => {
      App.search("wo", { limit: 5, withScores: true });

      expect(
        App.client.zrangeAsync
      ).toHaveBeenCalledWith("wo", 0, 4, 'WITHSCORES');
    });

    it("calls zrangeAsync with downcased prefixQuery", () => {
      App.search("Mew Two");

      expect(
        App.client.zrangeAsync
      ).toHaveBeenCalledWith("mew two", 0, -1);
    });
  });
});
