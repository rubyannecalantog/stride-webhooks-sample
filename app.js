require('dotenv').config();

const _ = require('lodash');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const request = require('request');
const prettyjson = require('prettyjson');
const opn = require('opn');

const app = express();
app.use(bodyParser.json());
app.use(express.static('.'));

//view engine
var exphbs = require('express-handlebars').create({
  layoutsDir: path.join(__dirname, 'views'),
  //partialsDir: path.join(__dirname, 'views/partials'),
  defaultLayout: 'logs',
  extname: 'hbs'
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', exphbs.engine);
app.set('view engine', 'hbs');

var server = http.createServer(app).listen(process.env.PORT, function () {
    var logsUrl = `http://localhost:${process.env.PORT}/logs`;
  console.log(`App running on port ${process.env.PORT}. Open ${logsUrl} to view real time logs from webhooks. This is an in memory persistence only.`);

  opn(logsUrl);
});

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const API_BASE_URL = 'https://api.atlassian.com';

const stride = require('./lib/stride.js').factory({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET
});

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server: server });
//const wss = new WebSocketServer({ port: '9090' });
/*
wss.on('connection', (ws: ExtWebSocket) => {

  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;

  });
});

setInterval(() => {
  wss.clients.forEach((ws: ExtWebSocket) => {

  if (!ws.isAlive) return ws.terminate();

  ws.isAlive = false;
  ws.ping(null, false, true);
});
}, 10000);*/

function prettify_json(data, options = {}) {
    return '{\n' + prettyjson.render(data, options) + '\n}';
}

function getAccessToken(callback) {
    const options = {
        uri: 'https://auth.atlassian.com/oauth/token',
        method: 'POST',
        json: {
            grant_type: "client_credentials",
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            "audience": "api.atlassian.com"
        }
    };
    request(options, function (err, response, body) {
        if (response.statusCode === 200 && body.access_token) {
            callback(null, body.access_token);
        } else {
            callback("could not generate access token: " + JSON.stringify(response));
        }
    });
}

function sendMessage(cloudId, conversationId, messageTxt, callback) {
    getAccessToken(function (err, accessToken) {
        if (err) {
            callback(err);
        } else {
            const uri = API_BASE_URL + '/site/' + cloudId + '/conversation/' + conversationId + '/message';
            const options = {
                uri: uri,
                method: 'POST',
                headers: {
                    authorization: "Bearer " + accessToken,
                    "cache-control": "no-cache"
                },
                json: {
                    body: {
                        version: 1,
                        type: "doc",
                        content: [
                            {
                                type: "paragraph",
                                content: [
                                    {
                                        type: "text",
                                        text: messageTxt
                                    }
                                ]
                            }
                        ]
                    }
                }
            }

            request(options, function (err, response, body) {
                callback(err, body);
            });
        }
    });
}

function sendReply(message, replyTxt, callback) {
    const cloudId = message.cloudId;
    const conversationId = message.conversation.id;
    const userId = message.sender.id;

    console.log('cloudId: ' + cloudId + ';conversationId: ' + conversationId + ';userId: ' + userId)

    sendMessage(cloudId, conversationId, replyTxt, function (err, response) {
        if (err) {
            console.log('Error sending message: ' + err);
            callback(err);
        } else {
            callback(null, response);
        }
    });
}

app.post('/installed',
    function (req, res) {
        console.log('app installed in a conversation');
        const cloudId = req.body.cloudId;
        const conversationId = req.body.resourceId;
        sendMessage(cloudId, conversationId, "Hi there! Thanks for adding me to this conversation. To see me in action, just mention me in a message", function (err, response) {
            if (err)
                console.log(err);
        });
        res.sendStatus(204);

        console.log("Logging installed");
        let _log = {
            useCase: `App installed in cloudId: ${cloudId} and conversationId: ${conversationId}`,
            responseDescription: "Conversation Event Response",
            urlFriendlyName: "Lifecycle",
            docUrl: "https://developer.atlassian.com/cloud/stride/apis/modules/chat/webhook/",
            responseBody: req.body
        }

        _logs.push(_log);
        publishLog(_log);
    }
);

app.post('/bot-mention',
  function (req, res) {
    console.log('bot mention');
    sendReply(req.body, "Hey, what's up? (Sorry, that's all I can do)", function (err, response) {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        res.sendStatus(204);
      }
    });
  }
);

/**
 * Don't worry about this for now.
 */
app.get('/descriptor', function (req, res) {
  fs.readFile('./app-descriptor.json', function (err, descriptorTemplate) {
    const template = _.template(descriptorTemplate);
    const descriptor = template({
      host: 'https://' + req.headers.host
    });
    res.set('Content-Type', 'application/json');
    res.send(descriptor);
  });
});

app.get('/logs', (req, res) => {
  console.log('logs');

  res.render('logs');
});

let _logs = [];

app.post('/roster-updated',
    stride.validateJWT,
    (req, res) => {
        try {
            const {cloudId, conversationId} = res.locals.context;
            console.log(`webhook:conversation:event incoming for ${conversationId}: ${req.body.type}`);

            let _log = {
                            useCase: "Roster Event Webhook",
                            responseDescription: "Roster Event Response",
                            urlFriendlyName: "Roster Events",
                            docUrl: "https://developer.atlassian.com/cloud/stride/apis/modules/chat/webhook/",
                            responseBody: req.body
                        }

            _logs.push(_log);
            res.sendStatus(200);

            publishLog(_log);

            //throw err;
        } catch (err) {
          console.error(`error found sending webhook response for conversation update: ${err}`);
          //throw err;
        }

    }
);

app.post('/conversation-updated',
  stride.validateJWT,
  (req, res) => {
    try {
      const {cloudId, conversationId} = res.locals.context;
      console.log(`webhook:conversation:event incoming for ${conversationId}: ${req.body.type}`);

      let _log = {
        useCase: "Conversation Event Webhook",
        responseDescription: "Conversation Event Response",
        urlFriendlyName: "Conversation Events",
        docUrl: "https://developer.atlassian.com/cloud/stride/apis/modules/chat/webhook/",
        responseBody: req.body
      }

      _logs.push(_log);
      res.sendStatus(200);

      publishLog(_log)

    } catch (err) {
      console.error(`error found sending webhook response for conversation update: ${err}`);
      //throw err;
    }

  }
);

function publishLog(_log) {
    console.log(`Sending to WebSockets: ${prettify_json(JSON.stringify(wss.clients))}`);

    try{
    wss.clients.forEach(function each(client) {
      console.log(`Sending to WebSockets: ${client}; with log: ${JSON.stringify(_log, undefined, 2)}`);
      client.send(JSON.stringify(_log, undefined, 2));
    });
  } catch(err) {
    console.log(err);
  }
}

