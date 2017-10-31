const App = require("./app");

const funNames = ['jay', 'tiffany', 'walid', 'kevin', 'waldo', 'wally', 'walden', 'jays', 'jacqueline', 'jay', 'jones', 'jay jay', 'homer jay simpson', 'tin', 'tim', 'timbuktu', 'till', 'true'];

App.insertCompletions(funNames);

App.bumpScore("walid");
App.bumpScore("waldo");
App.bumpScore("waldo");

App.setScore("walter", -500);

App.client.quit();
