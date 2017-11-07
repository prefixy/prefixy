prefix keys
 - keys
completions
 - all values for a prefix
 - all possible ways a prefix can be completed that we're storing
 - the "bucket" that a prefix key points to
suggestions
 - completions with the top score that are returned to the user
prefix query
 - what user inputs E.g. what they type into the field
selection
 - what user selects
submission
 - what user has typed when they submit search form
index
 - General: how we structure our data for prefix search
 - Specific: link between prefix and individual completion
score
 - score based on relevancy of this completion for the prefix