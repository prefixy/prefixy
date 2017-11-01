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
  .command('search <prefixQuery>')
  .action((prefixQuery) => (
    App.search(prefixQuery)
  ));

program.parse(process.argv);

App.client.quit();
