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
  .command('import <path>')
  .action(async path => {
    let result;

    try {
      result = await Prefixy.invoke(() => Prefixy.importFile(path));
    } catch(e) {
      console.log(e);
    }

    console.log("\n", result);
  });

program
  .command('insert <completion>')
  .action(async (completion) => {
    try {
      await Prefixy.invoke(() => Prefixy.insertCompletions([completion]));
    } catch(e) {
      console.log(e);
    }
  });

program
  .command('increment <completion>')
  .action(async completion => {
    try {
      await Prefixy.invoke(() => Prefixy.increment(completion));
    } catch(e) {
      console.log(e);
    }
  });

program
  .command('search <prefixQuery>')
  .option('-l, --limit <limit>', 'add a limit', Prefixy.suggestionCount)
  .option('-s, --with-scores')
  .action(async (prefixQuery, command) => {
    const withScores = command.withScores;
    const limit = command.limit;
    const args = [prefixQuery, { withScores, limit }];
    let result;

    try {
      result = await Prefixy.invoke(() => Prefixy.search(...args));
    } catch(e) {
      console.log(e);
    }

    console.log(result);
  });

program
  .command('delete <completion>')
  .action(async completion => {
    try {
      await Prefixy.invoke(() => Prefixy.deleteCompletions([completion]));
    } catch(e) {
      console.log(e);
    }
  });

program
  .command('persist <prefix>')
  .action(async prefix => {
    try {
      await Prefixy.invoke(() => Prefixy.persistPrefix(prefix));
    } catch(e) {
      console.log(e);
    }
  });

program
  .command('load <prefix>')
  .action(async prefix => {
    try {
      await Prefixy.invoke(() => Prefixy.loadPrefix(prefix));
    } catch(e) {
      console.log(e);
    }
  });


program.parse(process.argv);
