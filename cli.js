#!/usr/bin/env node

const App = require("./app");
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
  .action((completion, command) => {
    const arg = [
      { completion: completion, score: -command.withScore }
    ];
    App.insertCompletionsWithScores(arg);
  });

program
  .command('setscore <completion> <score>')
  .action((completion, score) =>
    App.setScore(completion, -score)
  );

program
  .command('search <prefixQuery>')
  .option('-s, --with-scores')
  .action((prefixQuery, command) => {
    if (command.withScores) {
      App.search(prefixQuery, { withScores: true })
        .then(reply => console.log(reply));
    } else {
      App.search(prefixQuery)
        .then(reply => console.log(reply));
    }
  });

program
  .command('suggestions <prefixQuery>')
  .option('-s, --with-scores')
  .action((prefixQuery, command) => {
    if (command.withScores) {
      App.search(prefixQuery, { limit: 5, withScores: true })
        .then(reply => console.log(reply));
    } else {
      App.search(prefixQuery, { limit: 5 })
        .then(reply => console.log(reply));
    }
  });

program
  .command('delete <completion>')
  .action(completion =>
    App.deleteCompletions([completion])
  );

program
  .command('increment <completion>')
  .action(completion =>
    App.bumpScore(completion)
  );

program
  .command('import <path>')
  .action(path =>
    App.importFile(path)
  );

program.parse(process.argv);

App.client.quit();
