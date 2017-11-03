#!/usr/bin/env node

const path = require("path");
const App = require(path.resolve(__dirname, "prefixy"));
const program = require("commander");

program
  .version('0.0.1')
  .description(`Prefixy: a prefix hash trie that utilizes
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
    await App.insertCompletionsWithScores(arg);
  });

program
  .command('setscore <completion> <score>')
  .action(async (completion, score) =>
    await App.setScore(completion, -score)
  );

program
  .command('search <prefixQuery>')
  .option('-s, --with-scores')
  .action(async (prefixQuery, command) => {
    let result;
    if (command.withScores) {
      result = await App.search(prefixQuery, { withScores: true });
    } else {
      result = await App.search(prefixQuery);
    }
    console.log(result);
  });

program
  .command('suggestions <prefixQuery>')
  .option('-s, --with-scores')
  .action(async (prefixQuery, command) => {
    let result;
    if (command.withScores) {
      result = await App.search(prefixQuery, { limit: 5, withScores: true });
    } else {
      result = await App.search(prefixQuery, { limit: 5 });
    }
    console.log(result);
  });

program
  .command('delete <completion>')
  .action(async completion =>
    await App.deleteCompletions([completion])
  );

program
  .command('increment <completion>')
  .action(async completion =>
    await App.bumpScore(completion)
  );

program
  .command('import <path>')
  .action(async path =>
    await App.importFile(path)
  );

program.parse(process.argv);

App.client.quit();
