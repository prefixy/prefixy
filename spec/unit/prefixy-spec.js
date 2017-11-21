const path = require("path");
const fs = require("fs");
const Prefixy = require(path.resolve(path.dirname(path.dirname(__dirname)), "prefixy"));

describe("Prefixy", () => {
  describe("extractPrefixes", () => {
    it("returns an array of prefixes for a completion", () => {
      expect(
        Prefixy.extractPrefixes("waldo")
      ).toEqual(["w", "wa", "wal", "wald", "waldo"]);
    });

    it("extracts the lower case prefixes of a completion", () => {
      expect(
        Prefixy.extractPrefixes("Mr. Mime")
      ).toEqual(["m", "mr", "mr.", "mr. ", "mr. m",
                 "mr. mi", "mr. mim", "mr. mime"]);
    });
  });

  describe("importFile", () => {
    let filePath;
    let fileCreated = false;
    const tenant = "unit-test";

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

      Prefixy.importFile(filePath, tenant);

      expect(
        Prefixy.insertCompletions
      ).toHaveBeenCalled();
    });

    xit("does not call insertCompletions when the path is invalid", () => {
      Prefixy.importFile("testtttttttttt-data.json", tenant);

      expect(
        Prefixy.insertCompletions
      ).not.toHaveBeenCalled();
    });

    xit("does not call insertCompletions when the JSON is invalid", () => {
      saveFile("['pikachu' 'bulbasaur' 'gengar']");

      Prefixy.importFile(filePath, tenant);

      expect(
        Prefixy.insertCompletions
      ).not.toHaveBeenCalled();
    });
  });

  describe("search", () => {
    const tenant = "unit-test";

    beforeEach(() => {
      spyOn(Prefixy.client, "zrangeAsync").and.callThrough();
      spyOn(Prefixy, "mongoLoad");
      spyOn(Prefixy, "normalizePrefix").and.callThrough();
      spyOn(Prefixy, "addTenant").and.callThrough();
    });

    it("calls zrangeAsync", () => {
      Prefixy.search("wo", tenant);

      expect(
        Prefixy.client.zrangeAsync
      ).toHaveBeenCalled();
    });

    it("calls normalizePrefix", () => {
      const prefix = "wo";
      Prefixy.search(prefix, tenant);

      expect(
        Prefixy.normalizePrefix
      ).toHaveBeenCalledWith("wo");
    });

    it("calls addTenant with normalized prefix", () => {
      const prefix = "Char   ManD  er";
      const normalizedPrefix = Prefixy.normalizePrefix(prefix);
      Prefixy.search(prefix, tenant);

      expect(
        Prefixy.addTenant
      ).toHaveBeenCalledWith(normalizedPrefix, tenant);
    });

    it("calls zrangeAsync with correct arguments", () => {
      const prefix = "wo";
      const prefixWithTenant = Prefixy.addTenant(Prefixy.normalizePrefix(prefix), tenant);
      Prefixy.search(prefix, tenant);

      expect(
        Prefixy.client.zrangeAsync
      ).toHaveBeenCalledWith(prefixWithTenant, 0, Prefixy.suggestionCount - 1);
    });

    it("calls zrangeAsync with the options provided to search", () => {
      const prefix = "wo";
      const prefixWithTenant = Prefixy.addTenant(Prefixy.normalizePrefix(prefix), tenant);
      Prefixy.search(prefix, tenant, { limit: 5, withScores: true });

      expect(
        Prefixy.client.zrangeAsync
      ).toHaveBeenCalledWith(prefixWithTenant, 0, 4, 'WITHSCORES');
    });
  });
});
