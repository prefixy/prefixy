#!/usr/bin/env node

require('dotenv').config();
const path = require("path");
const fs = require("fs");
const Prefixy = require(path.resolve(__dirname, "prefixy"));
const program = require("commander");
const jwt = require("jsonwebtoken");
const CONFIG_FILE = path.resolve(__dirname, "prefixy-config.json");

const updateTenant = tenant => {
  let opts = {};

    try {
      opts = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    } catch(e) {}

    opts = { ...opts, tenant};

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(opts), "utf8");
};

const loadTenant = () => {
  let opts = {};

  try {
    opts = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch(e) {}

  return opts.tenant;
};

const tenant = loadTenant();

program
  .version('0.0.1')
  .description(`Prefixy is a prefix hash trie that utilizes
    the skip list probabilistic data structure`);

program
  .command('ping')
  .action(() => console.log('PONG'));

program
  .command('token <token>')
  .action(token => {
    try {
      const tenant = jwt.verify(token, process.env.SECRET).tenant;
      updateTenant(tenant);
    } catch(e) {
      console.log("Invalid token -- tenant not updated");
      console.log(e);
    }
  });

program
  .command('tenant <tenant>')
  .action(tenant => {
    try {
      updateTenant(tenant);
    } catch(e) {
      console.log("Invalid tenant -- not updated");
      console.log(e);
    }
  });

program
  .command('import <path>')
  .action(async path => {
    let result;

    try {
      result = await Prefixy.invoke(() => Prefixy.importFile(path));
      Prefixy.quitRedisClient();
    } catch(e) {
      console.log(e);
    }

    console.log("\n", result);
  });

program
  .command('insert <completion>')
  .action(async completion => {
    try {
      await Prefixy.invoke(() => Prefixy.insertCompletions([completion], tenant));
      Prefixy.quitRedisClient();
    } catch(e) {
      console.log(e);
    }
  });

program
  .command('increment <completion>')
  .action(async completion => {
    try {
      await Prefixy.invoke(() => Prefixy.increment(completion, tenant));
      Prefixy.quitRedisClient();
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
    const args = [prefixQuery, tenant, { withScores, limit }];
    let result;

    try {
      result = await Prefixy.invoke(() => Prefixy.search(...args));
      Prefixy.quitRedisClient();
    } catch(e) {
      console.log(e);
    }

    console.log(result);
  });

program
  .command('delete <completion>')
  .action(async completion => {
    try {
      await Prefixy.invoke(() => Prefixy.deleteCompletions([completion], tenant));
      Prefixy.quitRedisClient();
    } catch(e) {
      console.log(e);
    }
  });

program.parse(process.argv);
