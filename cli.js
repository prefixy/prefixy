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
  .option('-s, --with-score <score>')
  .action((completion, command) =>
    App.setScore(completion, -command.withScore)
  );

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
      App.searchWithScores(prefixQuery);
    } else {
      App.search(prefixQuery);
    }
  });

program
  .command('suggestions <prefixQuery>')
  .option('-s, --with-scores')
  .action((prefixQuery, command) => {
    if (command.withScores) {
      App.top5SuggestionsWithScores(prefixQuery);
    } else {
      App.top5Suggestions(prefixQuery);
    }
  });

program
  .command('delete <completion>')
  .action(completion =>
    App.deleteCompletion(completion)
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
