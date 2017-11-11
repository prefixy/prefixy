const { Transform, Writable } = require("stream");
const path = require("path");

class Translator extends Transform {
  constructor(Prefixy, options={ objectMode: true }) {
    super(options);
    this.Prefixy = Prefixy;
  }

  _transform(item, encoding, callback) {
    const completion = item.completion || item;
    const score = item.score || 0;
    const prefixes = this.Prefixy.extractPrefixes(completion);

    let commands = [];
    prefixes.forEach(prefix =>
      commands.push(['zadd', prefix, -score, completion])
    );

    callback(null, commands);
  }
}

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

  async _write(commands, encoding, callback) {
    let result;

    console.log("Writing to redis, please wait...");
    Writer.logMemory("This import");

    try {
      result = await this.Prefixy.client.batch(commands).execAsync();
    } catch(e) {
      callback(e);
    }

    callback();
  }
}

module.exports = {
  Translator,
  Writer
};
