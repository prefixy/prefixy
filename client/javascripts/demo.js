const input = document.querySelector('input[type=text]');
const completionsUrl = 'http://localhost:3000/completions'
const incrementUrl = 'http://localhost:3000/increment'

new PrefixyComplete(input, completionsUrl, incrementUrl);
