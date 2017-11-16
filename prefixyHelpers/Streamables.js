const { Writable } = require("stream");
const path = require("path");

class Writer extends Writable {
  constructor(Prefixy, options={ objectMode: true }) {
    super(options);
    this.Prefixy = Prefixy;
  }

  static logMemory(task) {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`${task} uses approximately
      ${Math.round(used * 100) / 100} MB`);
  }

  async _write(item, encoding, callback) {
    let result;

    console.log("Writing to redis, please wait...");
    Writer.logMemory("This import");

    this.Prefixy.insertCompletions([item])
      .then(() => callback())
      .catch(callback);
  }
}

module.exports = {
  Writer
};
