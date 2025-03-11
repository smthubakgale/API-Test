// server.js
const express = require('express');
const http = require('http');
const { LongPollingServer, generateClientId } = require('./models/protocols/long-polling-server');

const app = express();
const httpServer = http.createServer(app);
const longPollingServer = new LongPollingServer(httpServer);

app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/events', (req, res) => { 
  longPollingServer.handleEventsRequest(req, res);
});

app.get('/message', (req, res) => {
  longPollingServer.handleMessageRequest(req, res);
});

app.get('/load-rooms', (req, res) => { 
    longPollingServer.handleLoadRoomsRequest(req , res);
});

app.get('/join-room', (req, res) => { 
    longPollingServer.handleJoinRoomRequest(req , res);
});

app.get('/leave-room', (req, res) => { 
  longPollingServer.handleLeaveRoomRequest(req, res); 
});

longPollingServer.start();

httpServer.listen(3000, () => {
  console.log('Server listening on port 3000');
});
