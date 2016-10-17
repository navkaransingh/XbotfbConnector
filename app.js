/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var bodyParser = require('body-parser');
var crypto = require('crypto');
var express = require('express');

// cfenv provides access to your Cloud Foundry environment 
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');


var request = require('request');

// create a new express server
var app = express();
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app nav environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host 
app.listen(appEnv.port, '0.0.0.0', function() {
	// print a message when the server starts listening
	console.log("server starting on " + appEnv.url);
});

app.get('/webhook', function(req, res) {
	console.log("Validating webhooks nav");
	if (req.query['hub.mode'] === 'subscribe' &&
		req.query['hub.verify_token'] === 'navkaran') {
		console.log("Validating webhooks nav");
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
		res.sendStatus(403);
	}
});

var senderId;

app.post('/webhook', function(req, res) {
console.log("event from facebook" ,req.body.entry[0].messaging);
		var events = req.body.entry[0].messaging;

		var event = events[0];
		if (event.message && event.message.text && !event.message.is_echo) {
			senderId = event.sender.id;
console.log("chat called");
console.log("sender id" , senderId);
			request({
				url: 'https://xbotchatprocessor.herokuapp.com/chat',
				method: 'POST',
				json: {
					"sender": {
						"id": senderId
					},
					"message": {
						"text": event.message.text
					}
				},
				headers: {
					'Content-Type': 'application/json'
				},
			}, function(error, response, body) {
				if (error) {
					console.log('Error sending message:   ', error);
				} else {
					console.log('nav ', JSON.stringify(response.body));
					if(response.body.text.text === 'live_agent_transfer'){
						
						console.log('Live agent transfered:  ');
					}else{
						sendMessage(event.sender.id,
						response.body.text
						);
					}
					
					
				}
			});



		}
		res.sendStatus(200);
	}


);


// generic function sending messages
function sendMessage(recipientId, message) {
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {
			access_token: 'EAAY7AGegDRMBAIo7iVCqoZCGAzVNGkKhIMWlXFNjnsB2eFDya9cESk0OSMJLNbLMatWbT1BjiRBLTqAbUKRS90Hv05TcZBZCTfIrbYsVUiOZA6CK6D4U7ZAqnsYcA8WS7bj3sQBIgpGxMZBb9KaRPQooeZAKAZAYRzW8x3tQj8bTpwZDZD'
		},
		method: 'POST',
		json: {
			recipient: {
				id: recipientId
			},
			message: message,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending message: ', error);
		} else if (response.body.error) {
			console.log('Error: ', response.body.error);
		}
	});
}

app.post("/liveagentchat", function(req, res) {
	console.log('senderId', req.body);
	var openQuestion = req.body.message;
	sendMessage(req.body.senderId, openQuestion);
	res.sendStatus(200);
});