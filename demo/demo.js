var form = document.querySelector('form');

const getSuggestions = (term, suggest) => {
  axios.get("http://localhost:3000/completions", {
    params: {
      prefix: term
    }
  }).then((response) => suggest(response.data))
};

const submitCompletion = (e) => {
  e.preventDefault();

  const completion = form.querySelector('input[type=text]').value;
  axios.put("http://localhost:3000/dynamic-increment", { completion });
  // axios.put("http://localhost:3000/increment", { completion });
};

new autoComplete({
  selector: 'input[type=text]',
  minChars: 1,
  delay: 0,
  cache: false,
  source: getSuggestions,
  onSelect: submitCompletion,
});

form.addEventListener('submit', submitCompletion);
