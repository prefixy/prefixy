Future Development Notes:
- only support single additions of completions in CLI
  - later we will support multiple additions from file
- only support single deletion of completions in CLI
- explore process.cwd() for command line import
- es6 import and export using babel? experimental features?
- move extractPrefixes, index, remove, and valid... to helper fn file
- DBC
- think about renaming bump
- profanity filter / ban list?

Possible Additions:
- allow batch updating of scores
- allow specifying scores in import
- is "search" a good name for our command line instruction?

=====================

API Endpoints:

##get /completions
As a app developer, I want to hit this endpoint with a prefix.
I expect the status of the response to be 200
I expect the result to be a json of suggestions for this prefix.
Request:
{
  prefix: "Go",
  limit: 5,
  withScores: true
}

Response:
[
  {
    completion: "Goku",
    score: -10000
  },
  {
    ...
  },
  ...
]

Request:
{
  prefix: "Mr. M",
}

Response:
["Mr. Mime", "Mr. Magoo", "Mr. Monster", "Mr. McDonald", "Mr. Macaroni"]

##put /increment
*only increments existing completions in dictionary*
As a app developer, I want to hit this endpoint with a completion
I expect the completion score to be incremented
and to be given a 200 to verify that happened
and an object that includes the completion and the score

Request:
"Mr. Mime"

Response:
{
  completion: "Mr. Mime",
  score: -3001
}

##put /dynamic-increment
*increments existing completions or adds it if not existing*

==============================
##increment discussion
Right now want to simply use increment/dynamicIncrement so we don't have to hold state about whether or not the app developer is using a fixed or dynamic dictionary. Their choice of incrementing endpoint will result in one or the other.

###dynamic dictionary desired endpoints (naive, no bucket limit)
- increment: will increment existing or add new (handle selections/submissions)
- import : ["oneword"]

###fixed dictionary desired endpoints (always naive, no bucket limit)
*we don't plan on supporting buckets for the fixed dictionary style
because we don't handle inbound new additions from users*
- increment: will only increment existing, not add new ones

###dynamic dictionary desired endpoints (bucket limit)
- increment: will increment existing and add new
- this will need logic for kicking out 300th and adding new ones and so on
- tabling this approach for now

==
we have max 300 in bucket
mr. mime in bucket
but it becomes less popular and get kicked out of m's bucket
but it still is in mr. m bucket
user types mr. m and selects mr. mime
increment mr. mime in every prefix that should belong to it
  if prefix doesn't include mr. mime, because it was kicked out, we want to re-add it.


##post /completions
(basically zadd for all the prefixes)
As an app developer, I expect to insert/update my prefix dictionary with the completions and optional scores supplied

Handles initial loading of data, handles mass updates, handles inserting one new completions, handles updating one completion

Request:
*adding new completions*
["Mr. Mime", "Mr. Magoo", "Mr. Monster", "Mr. McDonald", "Mr. Macaroni"]

OR

*adding/updating new/existing completions with scores*
[
  {
    completion: "Goku",
    score: -10000
  },
  {
    ...
  },
  ...
]

OR

*adding a new completion*
["new completion"]

or

*updating the score of an existing completion*
[
  {
    completion: "existing completion",
    score: -300
  }
]

Response:

ideally:
202 that returns a queue address as part of location header
queue address will return a 201 with payload once finished

first stab at it:
syncronous 204 (204 instead of 201 because we are not returning the object)
no body



##delete /completions
Request:
body: takes an array of completions
  ["Mr. Mime", "Mr. Magoo", "Mr. Monster", "Mr. McDonald", "Mr. Macaroni"]
  "String"

Response:
OK 204 did some stuff


##put  /score
Request:
body: takes a string of a completion
Response:
OK 200, { completion: "string", score: -213 }


# The summary
post   /completions             # insert/update one or more completions
delete /completions             # deletes one or more completions
get    /completions             # search prefix "ja"
                                #   give me completions["jay", "jane", "jam"]

put    /score                   # change score for a completion
put    /increment               # increment score for a completion
put    /dynamic-increment       # increment score for existing or add new comp

Not providing just a string for post/delete completions, just expect the app developer to be able to wrap their string in an array.

Tiffany: "they should just read the documentation"

==





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


