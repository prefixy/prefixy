const input = document.querySelector('input[type=text]');
const completionsUrl = 'http://localhost:3000/completions'
const dynamicIncrementUrl = 'http://localhost:3000/dynamic-increment'
const fixedIncrementUrl = 'http://localhost:3000/increment'

new PrefixyComplete(input, completionsUrl, dynamicIncrementUrl);
