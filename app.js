const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const Celebrate = require('celebrate');

const index = require('./routes/index');
const score = require('./routes/score');
const increment = require('./routes/increment');
const completions = require('./routes/completions');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/score', score);
app.use('/increment', increment);
app.use('/completions', completions);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('The requested endpoint could not be found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  if (err.isJoi) err.status = 400;
  return next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.json({error: err.message});
});

module.exports = app;
