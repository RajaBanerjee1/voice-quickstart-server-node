require('dotenv').config();
let dbModule = require('../../../common/dbModule.js');
const AccessToken = require('twilio').jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const defaultIdentity = 'alice';
const callerId = 'client:quick_start';
// Use a valid Twilio number by adding to your account via https://www.twilio.com/console/phone-numbers/verified
const callerNumber = '12037699667';

function login(request, response) {
  // Parse the identity from the http request
  var identity = null;
  if (request.method == 'POST') {
    identity = request.body.identity;
  }else {
    identity = request.query.identity;
  }

  if(!identity) {
    identity = defaultIdentity;
  }

	console.log('Getting user for identity ' + identity);

dbModule.getUserForDevice(identity)
        .then((user) =>
                {
                  
                  var jid = user.ExtNumber.replace("tel:+","")  + '@aurorascienceexploration.com' ;
                  
                  return response.send(jid);
                }
        )
.catch( error =>
                {
                console.log('Error raised trying to get user for identity' + error);
                });
}

/**
 * Creates an access token with VoiceGrant using your Twilio credentials.
 *
 * @param {Object} request - POST or GET request that provides the recipient of the call, a phone number or a client
 * @param {Object} response - The Response Object for the http request
 * @returns {string} - The Access Token string
 */
function tokenGenerator(request, response) {
  // Parse the identity from the http request
  var identity = null;
  if (request.method == 'POST') {
    identity = request.body.identity;
  } else {
    identity = request.query.identity;
  }

  if(!identity) {
    identity = defaultIdentity;
  }

	console.log('Generating token for ' + identity);
  // Used when generating any kind of tokens
  const accountSid = process.env.ACCOUNT_SID;
  const apiKey = process.env.API_KEY;
  const apiSecret = process.env.API_KEY_SECRET;

  // Used specifically for creating Voice tokens
  const pushCredSid = process.env.PUSH_CREDENTIAL_SID;
  const outgoingApplicationSid = process.env.APP_SID;

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: outgoingApplicationSid,
      pushCredentialSid: pushCredSid
    });

dbModule.getUserForDevice(identity)
	.then((user) =>
		{
		  // Create an access token which we will sign and return to the client,
		  // containing the grant we just created
		  const token = new AccessToken(accountSid, apiKey, apiSecret);
		  token.addGrant(voiceGrant);
		  token.identity = user.ExtNumber.replace("tel:+","")  + '_A_' + identity;
		  console.log('Token:' + token.toJwt());
		  return response.send(token.toJwt());
		}
	)
.catch( error =>
                {
                console.log('Error raised trying to get user ' + error);
                });
  
}

/**
 * Creates an endpoint that can be used in your TwiML App as the Voice Request Url.
 * <br><br>
 * In order to make an outgoing call using Twilio Voice SDK, you need to provide a
 * TwiML App SID in the Access Token. You can run your server, make it publicly
 * accessible and use `/makeCall` endpoint as the Voice Request Url in your TwiML App.
 * <br><br>
 *
 * @param {Object} request - POST or GET request that provides the recipient of the call, a phone number or a client
 * @param {Object} response - The Response Object for the http request
 * @returns {Object} - The Response Object with TwiMl, used to respond to an outgoing call
 */
function makeCall(request, response) {
  // The recipient of the call, a phone number or a client
  var to = null,from = null;
  if (request.method == 'POST') {
    to = request.body.to;
    from =  request.body.From.split('_')[0].replace('client:','');
  } else {
    to = request.query.to;
  }

  const voiceResponse = new VoiceResponse();
 console.log('Ging to call ' + to +' from ' + from );

  if (!to) {
      voiceResponse.say("Congratulations! You have made your first call! Good bye.");
  } else if (isNumber(to)) {
      const dial = voiceResponse.dial({callerId : from});
      dial.number(to);
  } else {
      const dial = voiceResponse.dial({callerId : from});
      dial.client(to);
  }
  console.log('Response:' + voiceResponse.toString());
  return response.send(voiceResponse.toString());
}

/* Added by Raja. Sends an SMS */
async function sendSMS(request,response){
  var to = null;
  if (request.method == 'POST') {
    to = request.body.to;
  } else {
    to = request.query.to;
  }
  var body = null;
  var identity = defaultIdentity;
  if (request.method == 'POST') {
    body = request.body.body;
    deviceID = request.body.identity;
  } else {
    body = request.query.body;
  }
 from =  request.body.identity.split('_')[0].replace('client:','');

  console.log(from + ' ' + to + ' '+ body);
  // The fully qualified URL that should be consulted by Twilio when the call connects.
  // var url = request.protocol + '://' + request.get('host') + '/sendSMS';
  // console.log(url);
  const accountSid = process.env.ACCOUNT_SID;
  const apiKey = process.env.API_KEY;
  const apiSecret = process.env.API_KEY_SECRET;
  const client = require('twilio')(apiKey, apiSecret, { accountSid: accountSid } );

var name   = to.substring(0, to.lastIndexOf("@"));
var domain = to.substring(to.lastIndexOf("@") +1);

if (isNaN(name))
	return;
else
	console.log('Sending ' + body + ' to ' + name );

client.messages
  .create({
     body: body,
     from: from ,
     to: name
   })
  .then(message => console.log(message.sid));

 response.status(200).set('Content-Type', 'text/plain').send('OK');
}

/**
 * Makes a call to the specified client using the Twilio REST API.
 *
 * @param {Object} request - POST or GET request that provides the recipient of the call, a phone number or a client
 * @param {Object} response - The Response Object for the http request
 * @returns {string} - The CallSid
 */
async function placeCall(request, response) {
  // The recipient of the call, a phone number or a client
  var to = null;
  if (request.method == 'POST') {
    to = request.body.to;
  } else {
    to = request.query.to;
  }
  console.log(to);
  // The fully qualified URL that should be consulted by Twilio when the call connects.
  var url = request.protocol + '://' + request.get('host') + '/incoming';
  console.log(url);
  const accountSid = process.env.ACCOUNT_SID;
  const apiKey = process.env.API_KEY;
  const apiSecret = process.env.API_KEY_SECRET;
  const client = require('twilio')(apiKey, apiSecret, { accountSid: accountSid } );

  if (!to) {
    console.log("Calling default client:" + defaultIdentity);
    call = await client.api.calls.create({
      url: url,
      to: 'client:' + defaultIdentity,
      from: callerId,
    });
  } else if (isNumber(to)) {
    console.log("Calling number:" + to);
    call = await client.api.calls.create({
      url: url,
      to: to,
      from: callerNumber,
    });
  } else {
    console.log("Calling client:" + to);
    call =  await client.api.calls.create({
      url: url,
      to: 'client:' + to,
      from: callerId,
    });
  }
  console.log(call.sid)
  //call.then(console.log(call.sid));
  return response.send(call.sid);
}

/**
 * Creates an endpoint that plays back a greeting.
 */
function incoming() {
  const voiceResponse = new VoiceResponse();
  voiceResponse.say("Congratulations! You have received your first inbound call! Good bye.");
  console.log('Response:' + voiceResponse.toString());
  return voiceResponse.toString();
}

function welcome() {
  const voiceResponse = new VoiceResponse();
  voiceResponse.say("Welcome to Twilio");
  console.log('Response:' + voiceResponse.toString());
  return voiceResponse.toString();
}

function isNumber(to) {
  if(to.length == 1) {
    if(!isNaN(to)) {
      console.log("It is a 1 digit long number" + to);
      return true;
    }
  } else if(String(to).charAt(0) == '+') {
    number = to.substring(1);
    if(!isNaN(number)) {
      console.log("It is a number " + to);
      return true;
    };
  } else {
    if(!isNaN(to)) {
      console.log("It is a number " + to);
      return true;
    }
  }
  console.log("not a number");
  return false;
}

exports.login = login;
exports.tokenGenerator = tokenGenerator;
exports.makeCall = makeCall;
exports.sendSMS = sendSMS;
exports.placeCall = placeCall;
exports.incoming = incoming;
exports.welcome = welcome;
