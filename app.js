const PORT = 3333;

if (!PORT) {
  console.log("Usage:");
  console.log("PORT=<http port> node app.js");
  process.exit();
}

const _ = require('lodash');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');

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

var server = http.createServer(app).listen(PORT, function () {
  console.log(`App running on port ${PORT}. Open http://localhost:${PORT}/logs to view real time logs from webhooks. This is an in memory persistence only.`);
  var host = server.address().address
  var port = server.address().port
});

const CLIENT_ID = 'ZTS66UGBjC737l1v45J3htdoXowucJdx';
const CLIENT_SECRET = '5tFOBL431M5AX3BSc6ScBZHnQLobt66cAf43QVDwcUn3bospIlbDAtDHxga8gX5D';

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

            console.log(`Sending to WebSockets: ${wss.clients}`);

            publishLog(_log);

            console.error(`error found sending webhook response for conversation update: ${err}`);
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

      console.log(`Sending to WebSockets: ${wss.clients}`);
      publishLog(_log)

    } catch (err) {
      console.error(`error found sending webhook response for conversation update: ${err}`);
      //throw err;
    }

  }
);

function publishLog(_log) {
  try{
    wss.clients.forEach(function each(client) {
      console.log(`Sending to WebSockets: ${client}; with log: ${JSON.stringify(_log)}`);
      client.send(JSON.stringify(_log));
    });
  } catch(err) {
    console.log(err);
  }
}

