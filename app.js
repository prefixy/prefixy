const redis = require("redis");
const client = redis.createClient();

// client.zadd('he', 1, 'hello');
// client.zincrby('he', 5, 'hello'); // 6
// client.zscore('he', 'hell', (err, reply) => {
//   console.log(reply)
//   console.log(err)
// });


// import
// input: take a collection of strings ("completions")
// output: number of items inserted
// side effect: index data into redis
// needs to process each completion

// for each completion
// subproblem: how to get all the prefixes of a string
// input: a string
// output: array of prefix substrings
// loop from 1 through length of string
// always slice 0 through i

// adding a completion to redis
// input: array of prefix strings
// output: none
// sideffect:
//   for each prefix
//   zadd prefix 0 completion

// later: configuration option - include full string

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

search("h");

client.quit();
