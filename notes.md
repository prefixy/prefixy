Future Development Notes:
- only support single additions of completions in CLI
  - later we will support multiple additions from file
- only support single deletion of completions in CLI
- explore process.cwd() for command line import

Possible Additions:
- allow batch updating of scores
- allow specifying scores in import
- is "search" a good name for our command line instruction?

=====================
2017-11-02 Meeting w/ Brandon

---
##Ways to write our functional test?

insertCompletions(data)
search() check if search returns the data


// testing search (functional test)?

-use client.zadd to add some stuff to the test-redis namespace
-call search
-expect return value to include what we zadded earlier

---

## Functional Tests
functional test implies reliance on other systems, unconnected components

functional test is basically any test that isn't a unit test or doesn't qualify as an integration test

##Making Async Calls Synchronous
```
 const test = async function() {
    await search().then((resolve) => {
      // expect whatever to happen
    }, (reject) => {})
  };
```

Don't actually need `then` when using `await` keyword.

`async` is a keyword used as part of function declaration to make a function asynchronous.


=====================


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


