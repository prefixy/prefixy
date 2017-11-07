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
      { completion: completion, score: -command.withScore }
    ];
    await Prefixy.insertCompletionsWithScores(arg);
  });

program
  .command('setscore <completion> <score>')
  .action(async (completion, score) => {
    const result = await Prefixy.setScore(completion, score);
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
    console.log(result);
  });

program
  .command('delete <completion>')
  .action(async completion =>
    await Prefixy.deleteCompletions([completion])
  );

program
  .command('increment <completion>')
  .action(async completion => {
    const scores = await Prefixy.fixedIncrementScore(completion)
    console.log(scores);
  });

program
  .command('import <path>')
  .action(async path =>
    await Prefixy.importFile(path)
  );

program.parse(process.argv);

Prefixy.client.quit();
