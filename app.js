const redis = require("redis");
// TODO: make createClient its own method, in order
// to pass in custom config options
const client = redis.createClient();

// later: configuration option - include full string
// also clean up completions before insertCompletionsing
// E.g. normalize case and whitespaces

const insertCompletions = completions => {
  completions.forEach(completion => {
    const prefixes = extractPrefixes(completion);
    index(prefixes, completion);
  });
  return completions.length;
};

const insertCompletion = completion => {
  insertCompletions([completion]);
  return 1;
};

const deleteCompletions = completions => {
  completions.forEach(completion => {
    const prefixes = extractPrefixes(completion);
    remove(prefixes, completion);
  });
  return completions.length;
};

const deleteCompletion = completion => {
  deleteCompletions([completion]);
  return 1;
};

const extractPrefixes = completion => {
  const prefixes = [];
  for (let i = 1; i <= completion.length; i++) {
    prefixes.push(completion.slice(0, i));
  }
  return prefixes;
};

const index = (prefixes, completion) => {
  prefixes.forEach(prefix =>
    client.zadd(prefix, 0, completion)
  );
};

const remove = (prefixes, completion) => {
  prefixes.forEach(prefix =>
    client.zrem(prefix, completion)
  );
};

const search = prefixQuery => {
  client.zrange(prefixQuery, 0, -1, (err, reply) =>
    console.log(reply)
  );
};

const returnTopXSuggestions = suggestionCount => {
  return prefixQuery => {
    client.zrange(prefixQuery, 0, suggestionCount - 1, (err, reply) =>
      console.log(reply)
    );
  }
};

const returnTop5Suggestions = returnTopXSuggestions(5);
const returnTop3Suggestions = returnTopXSuggestions(3);

// we increment by -1, bc this enables us to sort
// by frequency plus ascending lexographical order in Redis
const bumpScore = completion => {
  const prefixes = extractPrefixes(completion);
  prefixes.forEach(prefix =>
    client.zincrby(prefix, -1, completion)
  );
  return;
};

const setScore = (completion, score) => {
  const prefixes = extractPrefixes(completion);
  prefixes.forEach(prefix =>
    client.zadd(prefix, score, completion)
  );
};

module.exports = {
  client,
  insertCompletions,
  extractPrefixes,
  index,
  search,
  bumpScore,
  setScore,
  returnTopXSuggestions,
  returnTop5Suggestions
};
