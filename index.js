var dotenv = require('dotenv');
dotenv.config({ silent: true });
dotenv.load();

require('babel/register');

var App = require('./src/server');
var app = new App();
app.start();
