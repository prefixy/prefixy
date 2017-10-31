const redis = require("redis");
const client = redis.createClient();

client.zadd('he', 1, 'hello');
client.zincrby('he', 5, 'hello'); // 6
client.zscore('he', 'hell', (err, reply) => {
  console.log(reply)
  console.log(err)
});
client.quit();
