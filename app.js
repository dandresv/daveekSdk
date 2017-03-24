var express = require('express');
var request = 	require('request');
var bodyParser = require('body-parser');
var app = express();
var watson = require('watson-developer-cloud');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var workspace = '62b08e8c-6534-4eb8-aa2e-363c6eb30006';

var conversation_id = "";
var w_conversation = watson.conversation({
	url: 'https://gateway.watsonplatform.net/conversation/api',
	username: '59ca8718-7df2-4868-8ad1-912d98822784',
	password: 'KqCkW37A0HGe',
	version: 'v1',
	version_date: '2017-02-03'
});



// This code is called only when subscribing the webhook //
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'mySecretAccessToken') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong validation token');
})

app.post('/webhook/', function (req, res) {
	var text = null;
	
    messaging_events = req.body.entry[0].messaging;
	for (i = 0; i < messaging_events.length; i++) {	
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;

        if (event.message && event.message.text) {
			text = event.message.text;
		}else if (event.postback && !text) {
			text = event.postback.payload;
		}else{
			break;
		}
		
		var params = {
			input: text,
			context: {"conversation_id": conversation_id}
		}

		var payload = {
			workspace_id: workspace
		};

		if (params) {
			if (params.input) {
				params.input = params.input.replace("\n","");
				payload.input = { "text": params.input };
			}
			if (params.context) {
				payload.context = params.context;
			}
		}
		callWatson(payload, sender);
    }
    res.sendStatus(200);
});

function callWatson(payload, sender) {
	console.log("Iniciando la llamada a callWatson");
	console.log(JSON.stringify(payload, null, 2));
	w_conversation.message(payload, function (err, convResults) {
        if (err) {
            return responseToRequest.send("Erro.");
        }
		
		if(convResults.context != null)
		{
    	   conversation_id = convResults.context.conversation_id;
		}
		console.log("Revisión del convResults: ", convResults , " y el output del convResults", convResults.output);
        if(convResults != null && convResults.output != null){
			var i = 0;
			while(i < convResults.output.text.length){
				sendMessage(sender, convResults.output.text[i++]);
				console.log(JSON.stringify(convResults, null, 2));
			}
		}
            
    });
}

function sendMessage(sender, texta) {
	texta = texta.substring(0, 319);
	messageData = {	text: texta };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

var token = "EAABnz2O7e4ABAASEdnbxei9pPfFkRPyLzILZA8tK1wTcaWrrZBqnSxJDxMTzOORbv762isjyXPRvu4mrZCVuLRcqtLZAsrm3ZA0FBcHSEeBJWvV60zYpXa2FaFsk15gNzKnYERWYJOZAFldevT0bmtgGs4pxCrd5hra7CqZBoGIswZDZD";
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
app.listen(port, host);