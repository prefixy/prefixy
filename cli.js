#!/usr/bin/env node

const path = require("path");
const Prefixy = require(path.resolve(__dirname, "prefixy"));
const program = require("commander");
const errorMsg = "Oops! Something went wrong... Please try again.";

program
  .version('0.0.1')
  .description(`Prefixy is a prefix hash trie that utilizes
    the skip list probabilistic data structure`);

program
  .command('ping')
  .action(() => console.log('PONG'));

program
  .command('import <path>')
  .action(async path =>
    await Prefixy.invoke(() => Prefixy.importFile(path));
  );

program
  .command('insert <completion>')
  .option('-s, --with-score <score>', 'add a score', '0')
  .action(async (completion, command) => {
    const score = command.withScore;
    const arg = [{ completion, score }];

    try {
      await Prefixy.invoke(() => Prefixy.insertCompletions(arg));
    } catch(e) {
      console.log(errorMsg);
    }
  });

program
  .command('setscore <completion> <score>')
  .action(async (completion, score) => {
    try {
      await Prefixy.invoke(() => Prefixy.insertCompletions([{ completion, score }]));
    } catch(e) {
      console.log(errorMsg);
    }
  });

program
  .command('increment <completion>')
  .action(async completion => {
    try {
      await Prefixy.invoke(() => Prefixy.fixedIncrementScore(completion));
    } catch(e) {
      console.log(errorMsg);
    }
  });

program
  .command('search <prefixQuery>')
  .option('-s, --with-scores')
  .action(async (prefixQuery, command) => {
    const withScores = command.withScores;
    const args = [prefixQuery, { withScores }];
    let result;

    try {
      result = await Prefixy.invoke(() => Prefixy.search(...args));
    } catch(e) {
      console.log(errorMsg);
    }

    console.log(result);
  });

program
  .command('suggestions <prefixQuery>')
  .option('-l, --limit <limit>', 'add a limit', '5')
  .option('-s, --with-scores')
  .action(async (prefixQuery, command) => {
    const withScores = command.withScores;
    const limit = command.limit;
    const args = [prefixQuery, { withScores, limit }];
    let result;

    try {
      result = await Prefixy.invoke(() => Prefixy.search(...args));
    } catch(e) {
      console.log(errorMsg);
    }

    console.log(result);
  });

program
  .command('delete <completion>')
  .action(async completion => {

    try {
      await Prefixy.invoke(() => Prefixy.deleteCompletions([completion]));
    } catch(e) {
      console.log(errorMsg);
    }
  });

program.parse(process.argv);
