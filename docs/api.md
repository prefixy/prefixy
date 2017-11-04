# API Documentation

## GET /completions

As an app developer, I can use this endpoint to get a list
of top possible completions for a given prefix.

### Expected Payload:

A `"prefix"` attribute must be included in the json
request body.

The following optional attributes can also be included:

- `"limit"`
- `"withScores"`

If `"limit"` is not specified, the default limit of
5 will be returned.

### Example Request:

```json
{
  "prefix": "Mr. M"
}
```

```json
{
  "prefix": "Go",
  "limit": 5,
  "withScores": true
}
```

### Successful Response:

The response status code is 200 OK.

```json
[
  "Mr. Mime",
  "Mr. Magoo",
  "Mr. Monster",
  "Mr. McDonald",
  "Mr. Macaroni"
]
```

```json
[
  {
    "completion": "Goku",
    "score": -10000
  },
  {
    ...
  },
  ...
]
```

### Error Response:

## POST /completions

As an app developer, I can use this endpoint to load
new completions into my index. I can also use this endpoint
to update existing completions in my index.

### Expected Payload:

The json request body is expected to be either an
array of strings or an array of objects.

Whichever syntax is used, a completion must be specified.
The `"score"` attribute is optional.

### Example Request:

*adding new completions*

```json
[
  "Mr. Mime",
  "Mr. Magoo",
  "Mr. Monster",
  "Mr. McDonald",
  "Mr. Macaroni"
]
```

*adding new completions with scores*

```json
[
  {
    "completion": "Goku",
    "score": -10000
  },
  {
    ...
  },
  ...
]
```

*adding a single completion*

```json
  [
    "new completion"
  ]
```

*updating the score of an existing completion*

```json
[
  {
    "completion": "existing completion",
    "score": -300
  }
]
```

### Successful Response:

*ideally:*

202 returns a queue address as part of location header
queue address will return a 201 with payload once finished

*first stab at it:*

The response status code is 204 No Content.

### Error Response:

## DELETE /completions

As an app developer, I can use this endpoint to delete
existing completions in my index.

### Expected Payload:

The json request body is expected to be an array of
strings.

### Example Request:

```json
[
  "Mr. Mime",
  "Mr. Magoo",
  "Mr. Monster",
  "Mr. McDonald",
  "Mr. Macaroni"
]
```

```json
[
  "single completion"
]
```

### Successful Response:

The response status code is 204 No Content.

### Error Response:

## PUT /score

As an app developer, I can use this endpoint to manually
set the score of an existing completion. If the completion
does not yet exist in the index, the completion will
be added to the index with its score set to the desired
value.

### Expected Payload:

The `"completion"` and `"score"` attributes must be
included within the json request body.

### Example Request:

```json
{
  "completion": "string",
  "score": -213
}
```

### Successful Response:

The response status code is 200 OK or 201 Created.

```json
{
  "completion": "string",
  "score": -213
}
```

### Error Response:

## PUT /increment

As an app developer, I can use this endpoint to increment
an existing completion's score by 1. An error will be
returned if the completion does not exist in the index.

### Expected Payload:

The json request body is expected to be a string.

### Example Request:

```json
"Mr. Mime"
```

### Successful Response:

The response status code is 200 OK.

```json
{
  "completion": "Mr. Mime",
  "score": -3001
}
```

### Error Response:

## PUT /dynamic-increment

As an app developer, I can use this endpoint to increment
an existing completion's score by 1. If the completion
does not yet exist, the completion will be added to the
index with its score set to 1.

### Expected Payload:

The json request body is expected to be a string.

### Example Request:

```json
"Mr. Mime"
```

### Successful Response:

The response status code is 200 OK or 201 Created.

```json
{
  "completion": "Mr. Mime",
  "score": -3001
}
```

### Error Response:
