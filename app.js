const redis = require("redis");
// TODO: make createClient its own method, in order
// to pass in custom config options
const client = redis.createClient();

// later: configuration option - include full string
// also clean up completions before importing
// E.g. normalize case and whitespaces

const batchImport = completions => {
  completions.forEach(completion => {
    const prefixes = extractPrefixes(completion);
    index(prefixes, completion);
  });
  return completions.length;
};

const extractPrefixes = completion => {
  const prefixes = [];
  for (let i = 1; i <= completion.length; i++) {
    prefixes.push(completion.slice(0, i));
  }
  return prefixes;
};

const index = (prefixes, completion) => {
  prefixes.forEach(prefix => (
    client.zadd(prefix, 0, completion)
  ));
};


// const funNames = ['jay', 'tiffany', 'walid', 'kevin', 'waldo', 'wally', 'walden', 'jays', 'jacqueline', 'jay', 'jones', 'jay jay', 'homer jay simpson', 'tin', 'tim', 'timbuktu', 'till', 'true'];

// batchImport(funNames);

// input: string (the prefix we are querying)
// output: array of suggestions

const search = prefixQuery => {
  client.zrange(prefixQuery, 0, -1, (err, reply) => (
    console.log(reply)
  ));
};

// search("h");

// we increment by -1, bc this enables us to sort
// by frequency plus ascending lexographical order in Redis
const bumpScore = completion => {
  const prefixes = extractPrefixes(completion);
  prefixes.forEach(prefix => (
    client.zincrby(prefix, -1, completion)
  ));
  return;
};

bumpScore("walid");
bumpScore("waldo");
bumpScore("waldo");

client.quit();
