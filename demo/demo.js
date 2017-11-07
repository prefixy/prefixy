var my_autoComplete = new autoComplete({
  selector: 'input',
  minChars: 1,
  source: function(term, suggest) {
    axios.get("http://localhost:3000/completions", {
      params: {
        prefix: term
      }
    }).then((response) => suggest(response.data))
  }
});
