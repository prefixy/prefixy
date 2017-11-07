var form = document.querySelector('form');

const submitCompletion = (e) => {
  e.preventDefault();

  const completion = form.querySelector('input[type=text]').value;
  axios.put("http://localhost:3000/dynamic-increment", { completion });
  // axios.put("http://localhost:3000/increment", { completion });
};

var my_autoComplete = new autoComplete({
  selector: 'input[type=text]',
  minChars: 1,
  cache: false,
  source: function(term, suggest) {
    axios.get("http://localhost:3000/completions", {
      params: {
        prefix: term
      }
    }).then((response) => suggest(response.data))
  },
  onSelect: submitCompletion,
});

form.addEventListener('submit', submitCompletion);
