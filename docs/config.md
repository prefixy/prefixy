# Config Documentation

## Redis configuration

Prefixy expects that you already have a redis server
up and running. For best results and for the vast
majority of use cases, the redis server should also
be configured to be used as a cache. If this is not
already the case, all you have to do is add two lines
of text to a `redis.conf` file, which will be used to
restart the redis server.

### Example Redis configuration

Add these two lines in a file named `redis.conf`:

```
  maxmemory 2mb
  maxmemory-policy allkeys-lru
```

Now, in order for the configuration to take effect,
you should start/restart the server using this command:

`redis-server <path to redis.conf file>`

Fr more information on getting redis set up,
please see the following pages:

 - https://redis.io/topics/quickstart
 - https://redis.io/topics/config
 - https://redis.io/topics/lru-cache

## Prefixy configuration

Did you know you can set custom configuration options
for Prefixy? All you have to do is create a file named
`prefixy-config.json` in the `Prefixy` project directory.

### Example Prefixy configuration

In `prefixy-config.json`:

```json
{
  "redis": "redis://:p4ssw0rd@10.0.1.1:6380/15",
  "maxMemory": 250,
  "bucketLimit": 100,
  "minChars": 3,
  "suggestionCount": 10
}
```

### Configuration Options

#### `"redis"`
 - This is a `redis url`, which will be used to
 connect to the redis server. Defaults to
 `"redis://127.0.0.1:6379/0"`.

#### `"maxMemory"`
 - `Prefixy` will perform better if it knows
 the `maxmemory` limit set on your redis server.
 The value of `"maxMemory"` is expected to be an
 integer representing some amount of MB. For instance,
 `250` is interpreted as `250MB`.

#### `"suggestionCount"`
 - How many suggestions should be returned to the
 user? The default `"suggestionCount"` value is `5`.
 - It should be noted that this value is only a
 "fallback" number, and can always be overriden
 by specifying a `limit` when interacting with
 Prefixy via its command line interface or API endpoints.

#### `"minChars"`
 - Prefixy will only store prefixes with the
 specified amount of minimum characters. The
 default value of `"minChars"` is `1`.
 - This is recommended as a space-saving measure, since
 you usually don't need to show suggestions until a miminum
 amount of characters has been typed by the user.

#### `"bucketLimit"`
 - How many completions should Prefixy store for
 a given prefix? The default `"bucketLimit"` is a
 very conservative `50`, but we recommend setting
 this to an even smaller number to save space.
 - At the end of day, we only need to show the top
 5 or 10 suggestions to the user. And we can still
 get a very good approximation of the top 5 or so
 suggestions, whilst only keeping track of say, 50
 completions. This is true because all we need is
 an adequate runway for completions to rise to the top.
 - As far as specific numbers go, we think a `10:1`
 ratio of completions to prefixes is plenty to guarantee
 the adequate runway needed.

### References

For more information on the mental model behind our
`"bucketLimit"` rationale, please see [this post](http://oldblog.antirez.com/post/autocomplete-with-redis.html).
