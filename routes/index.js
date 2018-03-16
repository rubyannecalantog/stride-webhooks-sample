const _ = require('lodash');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const request = require('request');
const prettyjson = require('prettyjson');

const CLIENT_ID = 'ZTS66UGBjC737l1v45J3htdoXowucJdx';
const CLIENT_SECRET = '5tFOBL431M5AX3BSc6ScBZHnQLobt66cAf43QVDwcUn3bospIlbDAtDHxga8gX5D';
const API_BASE_URL = 'https://api.atlassian.com';

const router = express.Router();

let WebhookApp = {};

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


router.post('/installed',
    function (req, res) {
        console.log('app installed in a conversation');
        const cloudId = req.body.cloudId;
        const conversationId = req.body.resourceId;
        sendMessage(cloudId, conversationId, "Hi there! Thanks for adding me to this conversation. To see me in action, just mention me in a message", function (err, response) {
            if (err)
                console.log(err);
        });
        res.sendStatus(204);
    }
);

router.post('/bot-mention',
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
router.get('/descriptor', function (req, res) {
    fs.readFile('./app-descriptor.json', function (err, descriptorTemplate) {
        const template = _.template(descriptorTemplate);
        const descriptor = template({
            host: 'https://' + req.headers.host
        });
        res.set('Content-Type', 'application/json');
        res.send(descriptor);
    });
});

/**
 * core:webhook
 *
 * Your app can listen to specific events, like users joining/leaving conversations, or conversations being created/updated
 * Note: webhooks will only fire for conversations your app is authorized to access
 */

const stride = require('../lib/stride.js').factory({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET
});

router.post('/conversation-updated',
    stride.validateJWT,
    (req, res) => {
        try {
            const {cloudId, conversationId} = res.locals.context;
            console.log(`webhook:conversation:event incoming for ${conversationId}: ${req.body.type}`);
    
            //conversationEventResponse
            let conversationEventResponse = req.body;
    
            //Create useCase Format Atlassian Doc
            const doc = format.useCaseFormat({
                useCase: "Conversation Event Webhook",
                responseDescription: "Conversation Event Response",
                urlFriendlyName: "Conversation Events",
                docUrl: "https://developer.atlassian.com/cloud/stride/apis/modules/chat/webhook/",
                responseOrJSON: conversationEventResponse
            });

            _logs.push(doc);
            res.sendStatus(200);

        } catch (err) {
            console.error(`error found sending webhook response for conversation update: ${err}`);
            throw err;
        }
    }
);



let _logs = new Array();

router.get('/logs', (req, res) => {
    console.log('logs');

    res.render('logs');
});

module.exports = router;