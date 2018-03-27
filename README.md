# Stride API tutorial

This repo is the companion code to the Stride tutorial:
1. https://developer.atlassian.com/cloud/stride/getting-started/
2. https://developer.atlassian.com/cloud/stride/learning/explore-refapp/

**node 8 ** This code uses the cool features of recent JavaScript💛.  For a quick refresh: https://devhints.io/es6


#### Reference documentation:
* Stride API https://developer.atlassian.com/cloud/stride/rest/
* ADF - Atlassian Document Format https://developer.atlassian.com/cloud/stride/apis/document/structure/
  * see also https://bitbucket.org/atlassian/adf-builder-javascript#readme
* Manage your Stride apps https://developer.atlassian.com/apps/

#### Useful links:
* Stride developer portal https://developer.atlassian.com/cloud/stride/
* General on Stride Apps and concepts https://developer.atlassian.com/cloud/stride/integrating-with-stride/
* Guide for a first app https://developer.atlassian.com/cloud/stride/getting-started/

#### Prerequisites:
* NodeJs 8
* ES6
* ngrok
* Knowledge on how to install Stride apps in developer.atlassian.com

#### How to use it
1. Clone the project`$ git clone https://annecalantog@bitbucket.org/anneatlassian/stride-webhook-app.git`
2. In your favorite IDE, open webhookApp folder of the project
3. Make sure that you're using Node 8 as we're using ES6
4. Run `$ npm install` to install node modules
5. Once the dependencies are install, run `$ npm start` to start the app
6. Make sure to open browser first (`http://localhost:<PORT>/logs`) before installing in Stride
7. Run ngrok on `<PORT>` and test in browser: `<ngrokUrl>/descriptor` 
8. Install `<ngrokUrl>/descriptor` in developer.atlassian.com
9. Copy installation URL and install it in Stride app

#### How to test
1. `roster event` : test by adding or removing people in a conversation and see live changes in `/logs`
2. `conversation event` : test by archiving or updating privacy of a conversation

#### Endpoints:
* `POST /bot-mention` - Called by Stride whenever a bot is installed or mentioned in a conversation
* `GET /descriptor` - Returns the descriptor of the app. Used on install in the App Management in developer.atlassian.com
* `GET /logs` - Displays a real time logs whenever a webhook is hit in Stride. To function properly, upon `npm start` of your app, go to this link in browser to see.
* `POST /roster-updated` - Endpoint for the roster-updated webhook event to be called by Stride
* `POST /conversation-updated` - Endpoint for the conversation-updated webhook event to be called by Stride


#### Logs:
![Alt text](public/img/localhost-logs.png?raw=true "Logs")
