- [0. API Documentation](#0-api-documentation)
  - [1. GET /completions](#1-get-completions)
  - [2. POST /completions](#2-post-completions)
  - [3. DELETE /completions](#3-delete-completions)
  - [4. PUT /score](#4-put-score)
  - [5. PUT /increment](#5-put-increment)
  - [6. PUT /dynamic-increment](#6-put-dynamic-increment)

# API Documentation

## Example Error Responses:

All endpoints will return a 400 Bad Request if there was
something wrong with the request json body.

Otherwise, a 422 Unprocessable Entity will be returned if
the server could not process the request.

All endpoints will return errors in the following format:

```
{
  "error": "The request could not be processed"
}
```

## 1. GET /completions

This endpoint can be used to get a list
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

## 2. POST /completions

This endpoint can be used to load
new completions into your index. It can also be used
to update existing completions in the index.

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

## 3. DELETE /completions

This endpoint can be used to delete
existing completions in the index.

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

## 4. PUT /score

This endpoint can be used to manually
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

## 5. PUT /increment

This endpoint can be used to increment
an existing completion's score by 1. Nothing will occur
if the completion does not exist in the index. See
PUT /dyanamic-increment if you want the completion to be added
if it does not exist in the index while trying to increment.

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

The response status code is 204 No Content.

## 6. PUT /dynamic-increment

This endpoint can be used to increment
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

The response status code is 204 No Content.
