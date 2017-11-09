#!/usr/bin/env node

const path = require("path");
const Prefixy = require(path.resolve(__dirname, "prefixy"));
const program = require("commander");

program
  .version('0.0.1')
  .description(`Prefixy is a prefix hash trie that utilizes
    the skip list probabilistic data structure`);

program
  .command('ping')
  .action(() => console.log('PONG'));

program
  .command('insert <completion>')
  .option('-s, --with-score <score>', 'add a score', '0')
  .action(async (completion, command) => {
    const arg = [
      { completion: completion, score: command.withScore }
    ];

    await Prefixy.insertCompletions(arg);
    Prefixy.client.quit();
  });

program
  .command('setscore <completion> <score>')
  .action(async (completion, score) => {
    await Prefixy.insertCompletions([{ completion, score }]);
    Prefixy.client.quit();
  });

program
  .command('search <prefixQuery>')
  .option('-s, --with-scores')
  .action(async (prefixQuery, command) => {
    let result;
    if (command.withScores) {
      result = await Prefixy.search(prefixQuery, { withScores: true });
    } else {
      result = await Prefixy.search(prefixQuery);
    }
    Prefixy.client.quit();
    console.log(result);
  });

program
  .command('suggestions <prefixQuery>')
  .option('-s, --with-scores')
  .action(async (prefixQuery, command) => {
    let result;
    if (command.withScores) {
      result = await Prefixy.search(prefixQuery, { limit: 5, withScores: true });
    } else {
      result = await Prefixy.search(prefixQuery, { limit: 5 });
    }
    Prefixy.client.quit();
    console.log(result);
  });

program
  .command('delete <completion>')
  .action(async completion => {
    await Prefixy.deleteCompletions([completion])
    Prefixy.client.quit();
  });

program
  .command('increment <completion>')
  .action(async completion => {
    const scores = await Prefixy.fixedIncrementScore(completion)
    Prefixy.client.quit();
    console.log(scores);
  });

program
  .command('dynamicIncrement <completion> [limit]')
  .action(async (completion, limit) => {
    const scores = await Prefixy.dynamicIncrementScore(completion, limit);
    Prefixy.client.quit();
  });

program
  .command('import <path>')
  .action(async path => {
    await Prefixy.importFile(path)
    Prefixy.client.quit();
  });

program.parse(process.argv);
