const uuid = require('uuid');

function generateClientId(req) {
  const ipAddress = req.ip;
  const browserName = req.headers['user-agent'];
  const deviceId = req.headers['device-id'];
  const namespace = 'd8f6db77-1312-4bac-8a93-2a042155301c'; 
  const clientId = uuid.v5(`${ipAddress}${browserName}${deviceId}`, namespace);
    
  return clientId;
}

class LongPollingServer {
  constructor(httpServer) {
    this.httpServer = httpServer;
    this.clients = {};
    this.messages = [];
    this.rooms = {};
  }

  onConnection(clientId) {
    this.clients[clientId] = true;
    console.log(`Client connected: ${clientId}`);
  }


  onClientDisconnect(clientId) {
    delete this.clients[clientId];
    console.log(`Client disconnected: ${clientId}`);
  }

  broadcastMessage(message, options = {} , meId) {
    const { to, chat , room, broadcast, clientLeaveRoom, clientJoinRoom } = options;
    
    if (to) 
    {
      // Broadcast to a specific client 
	  
      if (this.clients[to]) { 
        this.messages.push({ clientId: meId , message, timestamp: Date.now(), read: [meId] , to , chat});
		 
      }
    } 
    else if (room) {
      // Broadcast to a room
      if (this.rooms[room]) {
		  
        this.rooms[room].forEach((clientId) => { 
		  this.messages.push({ clientId, message, timestamp: Date.now(), read: [meId] , room , clientJoinRoom , clientLeaveRoom });
		  
        });
      }
    } 
    else if(broadcast) {
      // Broadcast to everyone
      Object.keys(this.clients).forEach((clientId) => {
		   
            this.messages.push({ clientId, message, timestamp: Date.now(), read: [meId] , all:true }); 
		
      });
    }
	 
 
  }

  joinRoom(clientId, room) {
	  
    if (!this.rooms[room]) {
      this.rooms[room] = [];
    }
	
	if(!this.rooms[room].includes(clientId))
	{
	  this.rooms[room].push(clientId); 
      this.broadcastMessage(`Client ${clientId} joined room ${room}`, { room , clientJoinRoom : true } , clientId);
	}  
  }

  leaveRoom(clientId, room) {
    if (this.rooms[room]) {
      this.rooms[room] = this.rooms[room].filter((id) => id !== clientId);
      this.broadcastMessage(`Client ${clientId} left room ${room}`, { room , clientLeaveRoom:true } , clientId);
    }
  }

  handleEventsRequest(req, res) { 
    
    let clientId = req.query.clientId; 
	
	if(clientId == "undefined")
	{ 
	    clientId = generateClientId(req);
		 
	    if (!this.clients[clientId]) {
		  this.onConnection(clientId);
		}  
		 
		res.json([clientId]);
	}
	 
    if (this.messages.length === 0) {
 
      try
	  {
        res.json([]);
	  }
	  catch{}
	  
    } else {
      const messagesForClient = this.messages
        .filter((message) => message.clientId !== clientId && !message.read.includes(clientId))
        .map((message) => {
          if (!message.read) {
            message.read = [];
          }
          message.read.push(clientId);
          return message;
        }); 
 
      try
	  { 
        res.json(messagesForClient);
	  }
	  catch{}
    }
  }

  handleMessageRequest(req, res) {

    let clientId = req.query.clientId; 
	 
	if(clientId == "undefined")
	{ 
	    clientId = generateClientId(req);
		 
	    if (!this.clients[clientId]) {
		  this.onConnection(clientId);
		}  
	}

    const message = req.query.message;
    
    const broadcast = req.query.broadcast;
    const room = req.query.room;
    const to = req.query.to;
    const chat = req.query.chat;
	 
    this.broadcastMessage(message, {room , to , chat , broadcast} , clientId );

    res.send('Message sent!');
  }
  
  handleLoadRoomsRequest(req , res){
	  
    let clientId = req.query.clientId; 
	 
	if(clientId == "undefined")
	{ 
	    clientId = generateClientId(req);
		 
	    if (!this.clients[clientId]) {
		  this.onConnection(clientId);
		}  
	}
	
	const roomsWithClient = Object.keys(this.rooms).filter((room) => {
	  return this.rooms[room].includes(clientId);
	});
	
	res.json(roomsWithClient);
	
  }
  
  handleJoinRoomRequest(req, res) {

    let clientId = req.query.clientId; 
	 
	if(clientId == "undefined")
	{ 
	    clientId = generateClientId(req);
		 
	    if (!this.clients[clientId]) {
		  this.onConnection(clientId);
		}  
	}
	
    const room = req.query.room;
    this.joinRoom(clientId, room);

    var ret = {
		clientId : clientId , 
		room: room ,
		messages: this.messages
        .filter((message) => message.clientId !== clientId && message.room == room) ,
		clients: this.rooms[room].filter((id) => id !== clientId )
	};
	
    res.json(ret);
	
  }

  handleLeaveRoomRequest(req, res) {

    let clientId = req.query.clientId; 
	 
	if(clientId == "undefined")
	{ 
	    clientId = generateClientId(req);
		 
	    if (!this.clients[clientId]) {
		  this.onConnection(clientId);
		}  
	}
	
    const room = req.query.room;
    this.leaveRoom(clientId, room);
    res.status(200).send(`Left room ${room}`);
  }

  start() {
    this.httpServer.on('request', (req, res) => {
      if (req.url === '/events') {
        this.handleEventsRequest(req, res);
      } else if (req.url === '/message') {
        this.handleMessageRequest(req, res);
      } else if (req.url === '/join-room') {
        this.handleJoinRoomRequest(req, res);
      } else if (req.url === '/leave-room') {
        this.handleLeaveRoomRequest(req, res);
      }
    });
  }
}

module.exports = { generateClientId, LongPollingServer };
