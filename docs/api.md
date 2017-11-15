# API Documentation

## List of Endpoints:

  1. [`GET /completions`](#1-get-completions)
  2. [`POST /completions`](#2-post-completions)
  3. [`DELETE /completions`](#3-delete-completions)
  4. [`PUT /increment`](#4-put-increment)

## Example Error Responses:

All endpoints will return a 400 Bad Request if there was
something wrong with the request json body. If an invalid token was provided a 401 Unauthorized Access will be returned.

Otherwise, a 422 Unprocessable Entity will be returned if
the server could not process the request.

All endpoints will return errors in the following format:

```
{
  "error": "The request could not be processed"
}
```

## 1. `GET /completions`

This endpoint can be used to get a list
of top possible completions for a given prefix.

### 1.1. Expected Payload:

A `"prefix"` and `"token`" attributes must be included in the query string.

The following optional params can also be included:

- `"limit"`
- `"scores"`

If `"limit"` is not specified, the default limit of
5 will be returned.

### 1.2. Example Request:

```
"/completions?prefix=m&token=eyJhbGciOiJIUzI1NiI..."
```

```
"/completions?prefix=m&limit=3&scores=true&token=eyJhbGciOiJIUzI1NiI..."
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

## 2. `POST /completions`

This endpoint can be used to load new completions into your index.

### 2.1. Expected Payload:

The json request body is expected to an object consisting an array of strings and a token.

### 2.2. Example Request:

*adding new completions*

```json
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "completions": [
    "Mr. Mime",
    "Mr. Magoo",
    "Mr. Monster",
    "Mr. McDonald",
    "Mr. Macaroni"
  ]
}
```

*adding a single completion*

```json
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "completions": ["Mr. Mime"]
}
```


### 2.3. Successful Response:

The response status code is 204 No Content.

## 3. `DELETE /completions`

This endpoint can be used to delete
existing completions in the index.

### 3.1. Expected Payload:

The json request body is expected to an object consisting an array of strings and a token.

### 3.2. Example Request:

```json
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "completions": [
    "Mr. Mime",
    "Mr. Magoo",
    "Mr. Monster",
    "Mr. McDonald",
    "Mr. Macaroni"
  ]
}
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "completions": ["Mr. Mime"]
}
```

### 3.3. Successful Response:

The response status code is 204 No Content.

## 4. `PUT /increment`

This endpoint can be used to increment a completion's score by 1.

### 4.1. Expected Payload:

The json request body is expected to an object consisting a completion and a token.

### 4.2. Example Request:

```json
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "completion": "Mr. Mime"
}
```

### 4.3. Successful Response:

The response status code is 204 No Content.
