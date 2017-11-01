Future Development Notes:
- only support single additions of completions in CLI
  - later we will support multiple additions from file
- only support single deletion of completions in CLI


Possible Additions:
- allow batch updating of scores
- allow specifying scores in import

no broken windows
test early
 test often
  test all the time actually

"premature optimization is the root of all evil"

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

// input: completion
// output: return number of prefixes updated
// side effect: increment the score of the completion

// for every prefix of the completion,
//   we increment by 1 the completion in its bucket
