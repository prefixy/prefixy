const path = require("path");
const fs = require("fs");
const Prefixy = require(path.resolve(path.dirname(path.dirname(__dirname)), "prefixy"));

describe("Prefixy", () => {
  describe("extractPrefixes", () => {
    it("returns an array of prefixes for a completion", () => {
      expect(
        Prefixy.constructor.extractPrefixes("waldo")
      ).toEqual(["w", "wa", "wal", "wald", "waldo"]);
    });

    it("extracts the lower case prefixes of a completion", () => {
      expect(
        Prefixy.constructor.extractPrefixes("Mr. Mime")
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
      spyOn(Prefixy, "insertCompletions");
    });

    afterEach(() => {
      if (fileCreated) {
        fs.unlinkSync(filePath);
        fileCreated = false;
      }
    });

    xit("calls insertCompletions with parsed json data", () => {
      const data = JSON.stringify(["tiff", "wal", "jay"]);
      saveFile(data);

      Prefixy.importFile(filePath);

      expect(
        Prefixy.insertCompletions
      ).toHaveBeenCalled();
    });

    xit("does not call insertCompletions when the path is invalid", () => {
      Prefixy.importFile("testtttttttttt-data.json");

      expect(
        Prefixy.insertCompletions
      ).not.toHaveBeenCalled();
    });

    xit("does not call insertCompletions when the JSON is invalid", () => {
      saveFile("['pikachu' 'bulbasaur' 'gengar']");

      Prefixy.importFile(filePath);

      expect(
        Prefixy.insertCompletions
      ).not.toHaveBeenCalled();
    });
  });

  describe("search", () => {
    beforeEach(() => {
      spyOn(Prefixy.client, "zrangeAsync");
    });

    it("calls zrangeAsync", () => {
      Prefixy.search("wo");

      expect(
        Prefixy.client.zrangeAsync
      ).toHaveBeenCalled();
    });

    it("calls zrangeAsync with correct arguments", () => {
      Prefixy.search("wo");

      expect(
        Prefixy.client.zrangeAsync
      ).toHaveBeenCalledWith("wo", 0, -1);
    });

    it("calls zrangeAsync with the options provided to search", () => {
      Prefixy.search("wo", { limit: 5, withScores: true });

      expect(
        Prefixy.client.zrangeAsync
      ).toHaveBeenCalledWith("wo", 0, 4, 'WITHSCORES');
    });

    it("calls zrangeAsync with downcased prefixQuery", () => {
      Prefixy.search("Mew Two");

      expect(
        Prefixy.client.zrangeAsync
      ).toHaveBeenCalledWith("mew two", 0, -1);
    });
  });
});
