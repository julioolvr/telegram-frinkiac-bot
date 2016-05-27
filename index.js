var dotenv = require('dotenv');
dotenv.config({ silent: true });
dotenv.load();

require('babel/register');

var rollbar = require('rollbar');
rollbar.init(process.env.ROLLBAR_TOKEN, {
  environment: process.env.ROLLBAR_ENVIRONMENT || 'development'
});
rollbar.handleUncaughtExceptions(process.env.ROLLBAR_TOKEN);

var App = require('./src/server');
var app = new App();
app.start();
