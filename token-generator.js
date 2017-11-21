const randomstring = require("randomstring");
const jwt = require("jsonwebtoken");
const secret = "so-many-pizzerias"

const tenant = randomstring.generate(6);
const token = jwt.sign({tenant}, secret);
console.log("tenant:", tenant);
console.log("token:", token);

const decoded = jwt.verify(token, secret);
console.log("decoded:", decoded);

const testToken = jwt.sign({tenant: "test"}, secret);
console.log("test token:", testToken);
console.log(jwt.verify(testToken, secret));