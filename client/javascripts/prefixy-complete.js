function PrefixyComplete(input, prefixyUrl, opts={}) {
  this.input = input;
  this.completionsUrl = prefixyUrl + '/completions';
  this.incrementUrl = prefixyUrl + '/increment';
  this.delay = opts.delay || 0;
  this.token = opts.token;
  this.suggestionCount = opts.suggestionCount;
  this.minChars = opts.minChars || 1;

  this.listUI = null;
  this.overlay = null;

  this.wrapInput();
  this.createUI();
  this.valueChanged = debounce(this.valueChanged.bind(this), this.delay);
  this.bindEvents();

  this.reset();
}

PrefixyComplete.prototype.bindEvents = function() {
  this.input.addEventListener('input', this.valueChanged.bind(this));
  this.input.addEventListener('keydown', this.handleKeydown.bind(this));
  this.listUI.addEventListener('mousedown', this.handleMousedown.bind(this));
};

PrefixyComplete.prototype.wrapInput = function() {
  var wrapper = document.createElement('div');
  wrapper.classList.add('autocomplete-wrapper');
  wrapper.style.width = this.input.getBoundingClientRect().width + 'px';
  this.input.parentNode.insertBefore(wrapper, this.input);
  wrapper.appendChild(this.input);
};

PrefixyComplete.prototype.createUI = function() {
  var listUI = document.createElement('ul');
  listUI.classList.add('autocomplete-ui');
  this.input.parentNode.appendChild(listUI);
  this.listUI = listUI;

  var overlay = document.createElement('div');
  overlay.classList.add('autocomplete-overlay');
  overlay.style.width = this.input.clientWidth + 'px';

  this.input.parentNode.appendChild(overlay);
  this.overlay = overlay;
};

PrefixyComplete.prototype.draw = function() {
  var child;
  while (child = this.listUI.lastChild) {
    this.listUI.removeChild(child);
  }

  if (!this.visible) {
    this.overlay.textContent = '';
    return;
  }

  if (this.bestSuggestionIndex !== null && this.suggestions.length) {
    var selected = this.suggestions[this.bestSuggestionIndex];
    var inputText = this.input.value;
    this.overlay.textContent = inputText + selected.slice(inputText.length);
  } else {
    this.overlay.textContent = '';
  }

  this.suggestions.forEach(function(suggestion, index) {
    var li = document.createElement('li');
    li.classList.add('autocomplete-ui-choice');
    if (index === this.selectedIndex) {
      li.classList.add('selected');
      this.input.value = suggestion;
    }
    li.textContent = suggestion;
    this.listUI.appendChild(li);
  }.bind(this));
};

PrefixyComplete.prototype.fetchSuggestions = function(query, callback) {
  var params = { prefix: query, token: this.token }

  if (this.suggestionCount) {
    params.limit = this.suggestionCount;
  }

  axios.get(this.completionsUrl, { params })
    .then((response) => callback(response.data));
};

PrefixyComplete.prototype.submitCompletion = function() {
  var completion = this.input.value;

  this.input.value = '';
  axios.put(this.incrementUrl, { completion, token: this.token });
};

PrefixyComplete.prototype.handleKeydown = function(event) {
  switch(event.key) {
    case 'Tab':
      if (this.bestSuggestionIndex !== null) {
        this.input.value = this.suggestions[this.bestSuggestionIndex];
        event.preventDefault();
      }
      this.reset();
      break;
    case 'Enter':
      this.submitCompletion();
      this.reset();
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (this.selectedIndex === null || this.selectedIndex === 0) {
        this.selectedIndex = this.suggestions.length - 1;
      } else {
        this.selectedIndex -= 1;
      }
      this.bestSuggestionIndex = null;
      this.draw();
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (this.selectedIndex === null || this.selectedIndex === this.suggestions.length - 1) {
        this.selectedIndex = 0;
      } else {
        this.selectedIndex += 1;
      }
      this.bestSuggestionIndex = null;
      this.draw();
      break;
    case 'Escape':
      this.input.value = this.previousValue;
      this.reset();
      break;
  }
};

PrefixyComplete.prototype.handleMousedown = function(event) {
  event.preventDefault();

  var element = event.target;
  if (element.classList.contains('autocomplete-ui-choice')) {
    this.input.value = element.textContent;
    this.reset();
  }
};

PrefixyComplete.prototype.reset = function(event) {
  this.visible = false;
  this.suggestions = [];
  this.selectedIndex = null;
  this.previousValue = null;
  this.bestSuggestionIndex = null;
  this.draw();
};

PrefixyComplete.prototype.valueChanged = function() {
  var value = this.input.value;
  this.previousValue = value;
  if (value.length >= this.minChars) {
    this.fetchSuggestions(value, function(suggestions) {
      this.visible = true;
      this.suggestions = suggestions;
      this.selectedIndex = null;
      this.bestSuggestionIndex = 0;
      this.draw();
    }.bind(this));
  } else {
    this.reset();
  }
};
