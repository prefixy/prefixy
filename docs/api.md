- [0. API Documentation](#0-api-documentation)
  - [1. GET /completions](#1-get-completions)
  - [2. POST /completions](#2-post-completions)
  - [3. DELETE /completions](#3-delete-completions)
  - [4. PUT /scores](#4-put-scores)
  - [5. PUT /increment](#5-put-increment)
  - [6. PUT /dynamic-increment](#6-put-dynamic-increment)

# 0. API Documentation

## 1. GET /completions

As an app developer, I can use this endpoint to get a list
of top possible completions for a given prefix.

### 1.1. Expected Payload:

A `"prefix"` attribute must be included in the json
request body.

The following optional attributes can also be included:

- `"limit"`
- `"withScores"`

If `"limit"` is not specified, the default limit of
5 will be returned.

### 1.2. Example Request:

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

### 1.3. Successful Response:

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

### 1.4. Error Response:

## 2. POST /completions

As an app developer, I can use this endpoint to load
new completions into my index. I can also use this endpoint
to update existing completions in my index.

### 2.1. Expected Payload:

The json request body is expected to be either an
array of strings or an array of objects.

Whichever syntax is used, a completion must be specified.
The `"score"` attribute is optional.

### 2.2. Example Request:

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

### 2.3. Successful Response:

*ideally:*

202 returns a queue address as part of location header
queue address will return a 201 with payload once finished

*first stab at it:*

The response status code is 204 No Content.

### 2.4. Error Response:

## 3. DELETE /completions

As an app developer, I can use this endpoint to delete
existing completions in my index.

### 3.1. Expected Payload:

The json request body is expected to be an array of
strings.

### 3.2. Example Request:

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

### 3.3. Successful Response:

The response status code is 204 No Content.

### 3.4. Error Response:

## 4. PUT /score

As an app developer, I can use this endpoint to manually
set the score of an existing completion. If the completion
does not yet exist in the index, the completion will
be added to the index with its score set to the desired
value.

### 4.1. Expected Payload:

The `"completion"` and `"score"` attributes must be
included within the json request body.

### 4.2. Example Request:

```json
{
  "completion": "string",
  "score": -213
}
```

### 4.3. Successful Response:

The response status code is 200 OK.

```json
{
  "completion": "string",
  "score": -213
}
```

### 4.4. Error Response:

## 5 PUT /increment

As an app developer, I can use this endpoint to increment
an existing completion's score by 1. An error will be
returned if the completion does not exist in the index.

### 5.1. Expected Payload:

The json request body must include a `"completion"`
attribute.

### 5.2. Example Request:

```json
{
  "completion": "Mr. Mime"
}
```

### 5.3. Successful Response:

The response status code is 200 OK.

```json
{
  "completion": "Mr. Mime",
  "score": -3001
}
```

### 5.4. Error Response:

A 404 Not Found will be returned if the completion
does not exist in the index.

## 6. PUT /dynamic-increment

As an app developer, I can use this endpoint to increment
an existing completion's score by 1. If the completion
does not yet exist, the completion will be added to the
index with its score set to 1.

### 6.1. Expected Payload:

The json request body must include a `"completion"`
attribute.

### 6.2. Example Request:

```json
{
  "completion": "Mr. Mime"
}
```

### 6.3. Successful Response:

The response status code is 200 OK.

```json
{
  "completion": "Mr. Mime",
  "score": -3001
}
```

### 6.4. Error Response:


