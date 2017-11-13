const { Transform, Writable } = require("stream");
const path = require("path");
const { extractPrefixes } = require(path.resolve(__dirname, "utils"));

// class Translator extends Transform {
//   constructor(Prefixy, options={ objectMode: true }) {
//     super(options);
//     this.Prefixy = Prefixy;
//   }

//   _transform(item, encoding, callback) {
//     const commands = this.Prefixy.commandsToAddCompletion(item);
//     callback(null, commands);
//   }
// }

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

    const commands = this.Prefixy.commandsToAddCompletion(item);

    this.Prefixy.client.batch(commands).execAsync()
      .then(() => callback())
      .catch(callback);
  }
}

module.exports = {
  // Translator,
  Writer
};
