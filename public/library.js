class LongPollingClient {
  constructor(url, interval , retry = false , options = {}) {
    this.url = url;
    this.interval = interval;
    this.open = false;
    this.options = {};
	this.onload = true;
	this.retry = retry;
	this.roomload = false;
	
	
	this.events = options.events ? options.events : "/events";    
	this.message = options.message ? options.message : "/message"; 
	
	this.load_rooms = options.load_rooms ? options.load_rooms : "/load-rooms"; 
	this.join_room = options.join_room ? options.join_room : "/join-room"; 
	this.leave_room = options.leave_room ? options.leave_room : "/leave-room";
 
  }

  init(t) {
    var ts = this;
 
    if(ts.onload)
	{
		this.onload = false;
		
		const urlParams = new URLSearchParams(window.location.search);
	    const joinRoomParam = urlParams.get('joinRoom');
		
		console.log(joinRoomParam);

	    if (joinRoomParam && joinRoomParam != "undefined") 
		{
			if (ts.onroomlink !== null && typeof ts.onroomlink === 'function') {
              ts.onroomlink(joinRoomParam);
            } 
	    }
	}
 
    fetch(`${ts.url}${ts.events}?clientId=${ts.clientId}`)
      .then((response) =>  response.json() )
      .then((messages) => {
        if (!ts.open) {
          ts.open = true;

          if (ts.onopen !== null && typeof ts.onopen === 'function') {
			   
			  this.clientId = messages[0];
              ts.onopen();
          } 
		  
		  if(!ts.roomload)
		  {
			  ts.roomload = true;
			  
			  if (ts.loadrooms !== null && typeof ts.loadrooms === 'function') 
			  {
			     fetch(`${ts.url}${ts.load_rooms}?clientId=${ts.clientId}`)
				  .then((response) =>  response.json() )
				  .then((rooms) => 
				  {
					  rooms.forEach((room , index) =>
					  { 
						  console.log(room);
						  
						  ts.loadrooms(room);
					  });
				  })
				  .catch((error) =>{
					  console.error(error);
				  });
		  
			  } 
		  }
			  
		  setTimeout(()=>{ ts.init(ts) }, ts.interval);
        }

		if (Array.isArray(messages))
		{			 
			messages.forEach((data) =>
			{  
			    console.log(data); 
				
				if(data.room)
				{
				  if (data.clientJoinRoom) 
				  {
					const roomData = {
					  clientId : data.clientId ,
					  room : data.room
					};
					
					console.log(roomData);
					
					ts.onClientJoinRoom(roomData);
					
				  } 
				  else if (data.clientLeaveRoom) 
				  {
					const roomData = {
					  clientId : data.clientId ,
					  room : data.room
					};
					
					console.log(roomData);
					
					ts.onClientLeaveRoom(roomData);
				  }
				  else if (typeof data === 'object' && Object.keys(data).length > 0)
				  { 
					  const messageData = {
						message: data.message,
					    clientId : data.clientId ,
						from: `Room: ${data.room}`  ,
					  };
					
					  if (ts.onmessage !== null && typeof ts.onmessage === 'function')
					  {  
						ts.onmessage(messageData);
					  } 
				  }
				}
				else if(data.all) 
				{ 
					const messageData = {
					  message: data.message,
					  from: `Broadcast: ${data.clientId}`,
					};
				  
					if (ts.onmessage !== null && typeof ts.onmessage === 'function') {
					  ts.onmessage(messageData);
					} 
				}
				else if (data.to)
				{
					const messageData = {
					  message: data.message,
					  from: data.clientId ,
					  to : data.to ,
					  chat : data.chat 
					};
				  
					if (ts.onmessage !== null && typeof ts.onmessage === 'function') {
					  ts.onmessage(messageData);
					} 
				}
				else if(typeof data === 'object' && Object.keys(data).length > 0) { 
					const messageData = {
					  message: data.message,
					  from: `Client: ${data.clientId}`,
					};
				  
					if (ts.onmessage !== null && typeof ts.onmessage === 'function') {
					  ts.onmessage(messageData);
					}
				}
			});
	 
			setTimeout(()=>{ ts.init(ts) }, ts.interval);
		}
      })
      .catch((error) => {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          if (ts.open) {
            ts.open = false;

            if (ts.onclose !== null && typeof ts.onclose === 'function') {
              ts.onclose();
            }
          }
        } else {
          if (ts.onerror !== null && typeof ts.onerror === 'function') {
            ts.onerror(error);
          }
        }
  
        if(ts.retry){
          setTimeout(()=>{ ts.init(ts) }, ts.interval);
		}
        
      });
  }

  getQueryParams() {
    let queryParams = '';

    if (this.options.to) {
      queryParams += `to=${this.options.to}`;
    }

    if (this.options.room) {
      if (queryParams.length > 0) {
        queryParams += '&';
      }
      queryParams += `room=${this.options.room}`;
    }

    if (this.options.broadcast) {
      if (queryParams.length > 0) {
        queryParams += '&';
      }
      queryParams += `broadcast=${this.options.broadcast}`;
    }

    if (this.options.chat) {
      if (queryParams.length > 0) {
        queryParams += '&';
      }
      queryParams += `chat=${this.options.chat}`;
    }

    if (this.options.message) {
      if (queryParams.length > 0) {
        queryParams += '&';
      }
      queryParams += `message=${this.options.message}`;
    }

    if (this.options.clientId) {
      if (queryParams.length > 0) {
        queryParams += '&';
      }
      queryParams += `clientId=${this.options.clientId}`;
    }

    return queryParams;
  }

  sendMessage(message, options = {}) {
   
    var ts = this;
	
    var opts = options; 
    this.options = opts; 
    this.options.message = message;
	
    let params = this.getQueryParams();
	
	console.log(options , params);
  
    fetch(`${this.url}${ts.message}?clientId=${ts.clientId}&${params}`, {
      method: 'GET',
      params: { message: message },
    });
  }

  joinRoom(room) {
	
	var ts = this;
	  
    console.log(ts.clientId);
	  
	if(!ts.clientId){
		setTimeout(()=>
		{
			ts.joinRoom(room); 
			
		} , ts.interval);
		
		return;
	}
	
    console.log(room); 
	 
    fetch(`${this.url}${ts.join_room}?clientId=${ts.clientId}&room=${room}`)
      .then((response) => response.json())
      .then((data) => {
		 
        if (this.onjoinroom !== null && typeof this.onjoinroom === 'function') {
          try{ this.onjoinroom(data);}
		  catch(error){
			  console.error(error); 
		  }
        }
      }).catch((error)=>{
		  
		  console.error(error); 
		  setTimeout(()=>
		  {
			//ts.joinRoom(room); 
			
		  } , ts.interval);
		  
	  });
  }
  
  leaveRoom(room) {
	
	var ts = this;
	  
    console.log(ts.clientId);
	  
	if(!ts.clientId){
		setTimeout(()=>
		{
			ts.leaveRoom(room); 
			
		} , ts.interval);
		
		return;
	}
	
	console.log(room); 
	
    fetch(`${this.url}${ts.join_room}?clientId=${ts.clientId}&room=${room}`)
      .then((response) => response.text())
      .then((data) => {
		console.log(data); 
		
		const messageData = {
		  room: room 
		};
		
        if (this.onleaveroom !== null && typeof this.onleaveroom === 'function') {
          this.onleaveroom(messageData);
        }
      }).catch((error)=>{
		  
		  console.error(error); 
		  setTimeout(()=>
		  {
			ts.leaveRoom(room); 
			
		  } , ts.interval);
		  
	  });
  }
  
  onClientJoinRoom(data) {
    if (this.onclientjoinroom !== null && typeof this.onclientjoinroom === 'function') {
      this.onclientjoinroom(data);
    }
  }

  onClientLeaveRoom(data) {
    if (this.onclientleaveroom !== null && typeof this.onclientleaveroom === 'function') {
      this.onclientleaveroom(data);
    }
  }
}

/*
   :: Usage
const client = new LongPollingClient('http://localhost:3000/events', 1000);

client.onopen = () => {
  console.log('Connected to the server');
};

client.onmessage = (message) => {
  console.log(`Received message: ${message}`);
};

client.onerror = (error) => {
  console.log(`Error: ${error}`);
};

client.init();

client.sendMessage('Hello, everyone!');
client.sendMessage('Hello, John!', { to: 'john-client-id' });
client.sendMessage('Hello, room 1!', { room: 'room-1' });

client.onjoinroom = (data) => {
  console.log(`Joined room ${data.room}`);
  console.log(`Clients in room: ${data.clients}`);
};

client.onclientjoinroom = (data) => {
  console.log(`Client ${data.clientId} joined room ${data.room}`);
};

client.onclientleaveroom = (data) => {
  console.log(`Client ${data.clientId} left room ${data.room}`);
};

client.joinRoom('room-1');
client.leaveRoom('room-1');
   :: 
*/
