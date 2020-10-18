require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser')
const methods = require('./src/server.js');
const login = methods.login;
const tokenGenerator = methods.tokenGenerator;
const makeCall = methods.makeCall;
const placeCall = methods.placeCall;
const incoming = methods.incoming;
const welcome = methods.welcome;
const sendSMS = methods.sendSMS;
var twilio = require('twilio');

// Create Express webapp
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function(request, response) {
//  response.send(welcome());
  makeCall(request,response);
});

app.post('/', function(request, response) {
//  response.send(welcome());
 makeCall(request,response);
});

app.get('/accessToken', function(request, response) {
  tokenGenerator(request, response);
});

app.post('/accessToken', function(request, response) {
  tokenGenerator(request, response);
});

app.get('/makeCall', function(request, response) {
  makeCall(request, response);
});

app.get('/login', function(request, response) {
  login(request, response);
});
app.post('/login', function(request, response) {
  login(request, response);
});

app.post('/makeCall', function(request, response) {
  makeCall(request, response);
});
app.get('/sendSMS', function(request, response) {
  sendSMS(request, response);
});

app.post('/sendSMS', function(request, response) {
  sendSMS(request, response);
});
app.get('/placeCall', placeCall);

app.post('/placeCall', placeCall);

app.get('/incoming', function(request, response) {
  response.send(incoming());
});

app.post('/incoming', function(request, response) {
  response.send(incoming());
});

// Create an http server and run it
const server = http.createServer(app);
const port = process.env.PORT || 8000;
server.listen(port, function() {
  console.log('Express server running on *:' + port);
});
