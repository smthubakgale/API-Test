
const currentUrl = window.location.origin;

var client = new LongPollingClient(currentUrl , 1500);

let currentRoom = null;
let currentClient = null;

client.onopen = () => {
  console.log('Connected to the server');
};

client.onclose = () => {
  console.log("closing");
}

client.onerror = (error) => {
  console.error(error);
};

client.onmessage = (messageData) => {
 
  console.log(messageData);
 
  const messageElement = document.createElement('li');
  
  if(messageData.to)
  {
	 console.log(messageData); 
	 
	 if(messageData.chat == "true"){
		 createChat(messageData["from"]);
	 }
	 else{
		joinChat(messageData["from"]); 
	 }
	 
	 console.log(`client-${messageData.from}-messages`);
	 
     const clientMessagesList = document.getElementById(`client-${messageData.from}-messages`);
	 
	 console.log(clientMessagesList);

     messageElement.textContent = `Client: ${messageData.message}`;
     clientMessagesList.appendChild(messageElement);
	 
  }
  else if (messageData["from"].includes('Room:')) {
	   
    const roomName = messageData["from"].split(':')[1].trim();
    const roomMessagesList = document.getElementById(`room-${roomName}-messages`);

    messageElement.textContent = `${messageData.clientId}: ${messageData.message}`;
    roomMessagesList.appendChild(messageElement);
  } 
  else if (messageData["from"].includes('Client:')) {
	   
    const clientName = messageData["from"].split(':')[1].trim();
    const clientMessagesList = document.getElementById(`client-${clientName}-messages`);

    messageElement.textContent = `${messageData.message}`;
    clientMessagesList.appendChild(messageElement);
  }
  else if (messageData["from"].includes('Broadcast:')) { 
	  
    const broadCastMessagesList = document.getElementById(`broadcast-messages`);

    const clientName = messageData["from"].split(':')[1].trim();
    messageElement.textContent = `${clientName}: ${messageData.message}`;
    broadCastMessagesList.appendChild(messageElement);
  }
};

client.onjoinroom = (data) => {
		
  console.log(data);
  
  currentRoom = data.room;
  const roomElement = document.getElementById(`room-${currentRoom}`);
  
  console.log(roomElement); 
  
  if (!roomElement) {
	  
    const roomsList = document.getElementById('rooms-list');
    const roomListItem = document.createElement('li');
    roomListItem.id = `room-${currentRoom}`;
    roomListItem.textContent = currentRoom;
    roomsList.appendChild(roomListItem);
	
    roomListItem.addEventListener('click', () => {
      client.joinRoom(currentRoom);
      currentRoom = roomListItem.textContent;
	  
      roomBlock();
	  currentRoom = roomListItem.textContent;
		var roomMessages = document.querySelectorAll(".room-messages");
		if (roomMessages !== null) {
		  roomMessages.forEach((roomMessage) => {
			roomMessage.style.display = 'none';
		  });
		}
		
	  let roomShow  = document.querySelector(`#room-${currentRoom}-messages-container`);
	  console.log(`room-${currentRoom}-messages-container` , roomShow);
	  roomShow.style.display = "block";
	});
  }
  else {
	  //
	const previousSiblings = [];
	let sibling = roomElement.previousElementSibling;

	while (sibling) {
	  previousSiblings.push(sibling.id);
	  sibling = sibling.previousElementSibling;
	}
	 
	previousSiblings.forEach((id)=>
	{
		console.log(id);
		let roomShow  = document.querySelector(`#${id}-messages-container`);
		roomShow.style.display = 'none';
	}) 
	// 
	  roomBlock();
  }

  
  function roomBlock(){
	  const roomMessagesList = document.getElementById(`room-${currentRoom}-messages`);
      if (!roomMessagesList) {
		  
        const roomMessagesContainer = document.createElement('div');
        roomMessagesContainer.id = `room-${currentRoom}-messages-container`;
		roomMessagesContainer.classList.add('room-messages');
        const roomMessagesHeader = document.createElement('h3');
        roomMessagesHeader.textContent = `Room: ${currentRoom}`;
        roomMessagesContainer.appendChild(roomMessagesHeader);
        const roomMessagesListElement = document.createElement('ul');
        roomMessagesListElement.id = `room-${currentRoom}-messages`;
        roomMessagesContainer.appendChild(roomMessagesListElement);
        const inputField = document.createElement('input');
        inputField.id = `room-${currentRoom}-message`;
        inputField.type = 'text';
        inputField.placeholder = 'Enter message';
        roomMessagesContainer.appendChild(inputField);
        const sendButton = document.createElement('button');
        sendButton.textContent = 'Send Message';
        sendButton.onclick = () => {
          const message = inputField.value; 
		  
          client.sendMessage(message, { room: currentRoom });
          inputField.value = '';
		  
          const messageElement = document.createElement('li');
		  messageElement.textContent = `Me: ${message}`;
          roomMessagesListElement.appendChild(messageElement);
	
        };
        roomMessagesContainer.appendChild(sendButton);
        document.getElementById('rooms-content').appendChild(roomMessagesContainer);
		
		
        data.messages.forEach((messageData)=>
		{ 
           const messageElement = document.createElement('li');
		   
		   if(messageData.message.includes("joined room")){
              messageElement.textContent = `${messageData.message}`; 
			  
			  if(!messageData.message.includes(data.clientId))
			  { 
                 roomMessagesListElement.appendChild(messageElement);
			  }
		   }
		   else
		   {
			   if(!messageData.read.includes(messageData.clientId)){
                  messageElement.textContent = `Me: ${messageData.message}`;
			   }
			   else{
                  messageElement.textContent = `${messageData.clientId}: ${messageData.message}`;
			   }
              roomMessagesListElement.appendChild(messageElement);
		   }
		   
		});
      }
    
  }
 
  data.clients.forEach((clientId) => {
     joinChat(clientId);
  });
};

function joinChat(clientId , chat = "false")
{
	console.log(clientId);
	
	let clientListItem = document.getElementById(`client-${clientId}`);
	console.log(clientListItem);
	
	if (!clientListItem) {
	  clientListItem = document.createElement('li');
	  clientListItem.id = `client-${clientId}`;
	  clientListItem.textContent = clientId;
	  
	  const clientsList = document.getElementById('clients-list');
	  clientsList.appendChild(clientListItem);
	  
	  console.log("APpend");
	  
	  clientListItem.addEventListener('click', () => {
		 chatBlock(clientId , chat);
	  });
	}
  	else{
		chatBlock(clientId , chat);
	}
		
}

function chatBlock(clientId , chat = "false"){
	currentClient = clientId;
	const clientMessagesList = document.getElementById(`client-${currentClient}-messages`);
	if (!clientMessagesList) {
	  const clientMessagesContainer = document.createElement('div');
	  clientMessagesContainer.id = `client-${currentClient}-messages-container`;
	  const clientMessagesHeader = document.createElement('h3');
	  clientMessagesHeader.textContent = `Client: ${currentClient}`;
	  clientMessagesContainer.appendChild(clientMessagesHeader);
	  const clientMessagesListElement = document.createElement('ul');
	  clientMessagesListElement.id = `client-${currentClient}-messages`;
	  clientMessagesContainer.appendChild(clientMessagesListElement);
	  const inputField = document.createElement('input');
	  inputField.id = `client-${currentClient}-message`;
	  inputField.type = 'text';
	  inputField.placeholder = 'Enter message';
	  clientMessagesContainer.appendChild(inputField);
	  const sendButton = document.createElement('button');
	  sendButton.textContent = 'Send Message';
	  sendButton.onclick = () => {
		const message = inputField.value;
		client.sendMessage(message, { to: currentClient , chat:chat });
		inputField.value = '';
		 
		const messageElement = document.createElement('li');
		messageElement.textContent = `Me: ${message}`;
		clientMessagesListElement.appendChild(messageElement);
		
	  };
	  
	  
	  clientMessagesContainer.appendChild(sendButton);
	  document.getElementById('clients-content').appendChild(clientMessagesContainer);
	}
	
	const otherClients = document.querySelectorAll(`#clients-content > div:not(#client-${currentClient}-messages-container)`);
	otherClients.forEach((client) => {
	  client.style.display = 'none';
	});
	
	const clientMessagesContainer2 = document.getElementById(`client-${currentClient}-messages-container`);
	clientMessagesContainer2.style.display = 'block';
}


client.onclientjoinroom = (data) => {
  
  console.log(data);
  
  
  if (currentRoom === data.room) {
    let roomMessagesList = document.getElementById(`room-${currentRoom}-messages`);
    
    // Create roomMessagesList if it doesn't exist
    if (!roomMessagesList) {
      const roomMessagesContainer = document.createElement('div');
      roomMessagesContainer.id = `room-${currentRoom}-messages-container`;
	  roomMessagesContainer.classList.add('room-messages');
      const roomMessagesHeader = document.createElement('h3');
      roomMessagesHeader.textContent = `Room: ${currentRoom}`;
      roomMessagesContainer.appendChild(roomMessagesHeader);
      roomMessagesList = document.createElement('ul');
      roomMessagesList.id = `room-${currentRoom}-messages`;
      roomMessagesContainer.appendChild(roomMessagesList);
      const inputField = document.createElement('input');
      inputField.id = `room-${currentRoom}-message`;
      inputField.type = 'text';
      inputField.placeholder = 'Enter message';
      roomMessagesContainer.appendChild(inputField);
      const sendButton = document.createElement('button');
      sendButton.textContent = 'Send Message';
      sendButton.onclick = () => {
        const message = inputField.value; 
		  
        client.sendMessage(message, { room: currentRoom });
        inputField.value = '';
		  
        const messageElement = document.createElement('li');
        messageElement.textContent = `Me: ${message}`;
        roomMessagesList.appendChild(messageElement);
      };
      roomMessagesContainer.appendChild(sendButton);
      document.getElementById('rooms-content').appendChild(roomMessagesContainer);
    }
    
    const messageElement = document.createElement('li');
    messageElement.textContent = `Client ${data.clientId} joined the room`;
    roomMessagesList.appendChild(messageElement);

    let clientListItem = document.getElementById(`client-${data.clientId}`);
    console.log(`client-${data.clientId}`);
    console.log(clientListItem);
    
    if (!clientListItem) {
      clientListItem = document.createElement('li');
      clientListItem.id = `client-${data.clientId}`;
      clientListItem.textContent = data.clientId;
      const clientsList = document.getElementById('clients-list');
      clientsList.appendChild(clientListItem);
      clientListItem.addEventListener('click', () => {
        currentClient = data.clientId;
        const clientMessagesList = document.getElementById(`client-${currentClient}-messages`);
        if (!clientMessagesList) {
          const clientMessagesContainer = document.createElement('div');
          clientMessagesContainer.id = `client-${currentClient}-messages-container`;
          const clientMessagesHeader = document.createElement('h3');
          clientMessagesHeader.textContent = `Client: ${currentClient}`;
          clientMessagesContainer.appendChild(clientMessagesHeader);
          const clientMessagesListElement = document.createElement('ul');
          clientMessagesListElement.id = `client-${currentClient}-messages`;
          clientMessagesContainer.appendChild(clientMessagesListElement);
          const inputField = document.createElement('input');
          inputField.id = `client-${currentClient}-message`;
          inputField.type = 'text';
          inputField.placeholder = 'Enter message';
          clientMessagesContainer.appendChild(inputField);
          const sendButton = document.createElement('button');
          sendButton.textContent = 'Send Message';
          sendButton.onclick = () => {
            const message = inputField.value;
            client.sendMessage(message, { to: currentClient });
            inputField.value = '';
            
            const messageElement = document.createElement('li');
            messageElement.textContent = `Me: ${message}`;
            clientMessagesListElement.appendChild(messageElement);
          };
          clientMessagesContainer.appendChild(sendButton);
          document.getElementById('clients-content').appendChild(clientMessagesContainer);
        }
        const otherClients = document.querySelectorAll(`#clients-content > div:not(#client-${currentClient}-messages-container)`);
        otherClients.forEach((client) => {
          client.style.display = 'none';
        });
        clientMessagesContainer.style.display = 'block';
      });
    }
  }
};

client.onclientleaveroom = (data) => {
  console.log(`Client ${data.clientId} left room ${data.room}`);
  if (currentRoom === data.room) {
    const roomMessagesList = document.getElementById(`room-${currentRoom}-messages`);
    const messageElement = document.createElement('li');
    messageElement.textContent = `Client ${data.clientId} left the room`;
    roomMessagesList.appendChild(messageElement);
    const clientListItem = document.getElementById(`client-${data.clientId}`);
    if (clientListItem) {
      clientListItem.remove();
    }
  }
};

client.onroomlink = (roomName)=>
{
    currentRoom = roomName;
    
    joinRoom(roomName); 
};

client.init();

document.getElementById('send-broadcast').addEventListener('click', () => {
  const broadcastMessageInput = document.getElementById('broadcast-message');
  const message = broadcastMessageInput.value;
  client.sendMessage(message, { broadcast: true });
  broadcastMessageInput.value = '';
  
  
  const messageElement = document.createElement('li');
  messageElement.textContent = `Me : ${message}`;
  
  const broadCastMessagesList = document.getElementById(`broadcast-messages`); 
  broadCastMessagesList.appendChild(messageElement);
  
});


document.getElementById('create-client').addEventListener('click', () => {
  const clientNameInput = document.getElementById('client-name');
  const clientName = clientNameInput.value;
  clientNameInput.value = '';

  createChat(clientName);
  
});

function createChat(clientName){
  // 
  currentClient = clientName;
  const clientElement = document.getElementById(`client2-${currentClient}`);
  
  console.log(clientElement); 
  
  if (!clientElement) {
	  
    const clientsList = document.getElementById('clients-list2');
    const clientListItem = document.createElement('li');
    clientListItem.id = `client2-${currentClient}`;
    clientListItem.textContent = currentClient;
    clientsList.appendChild(clientListItem);
	
	console.log(clientsList);
	
    clientListItem.addEventListener('click', () => {
      client.joinClient(currentClient);
      currentClient = clientListItem.textContent;
	  
      chatBlock(currentClient , "true");
	  currentClient = clientListItem.textContent;
		var clientMessages = document.querySelectorAll(".client-messages");
		if (clientMessages !== null) {
		  clientMessages.forEach((clientMessage) => {
			clientMessage.style.display = 'none';
		  });
		}
		
	  let clientShow  = document.querySelector(`#client-${currentClient}-messages-container`);
	  console.log(`client-${currentClient}-messages-container` , clientShow);
	  clientShow.style.display = "block";
	});
	
    chatBlock(clientName , "true");
  }
  else {
	  //
	const previousSiblings = [];
	let sibling = clientElement.previousElementSibling;

	while (sibling) {
	  previousSiblings.push(sibling.id);
	  sibling = sibling.previousElementSibling;
	}
	 
	previousSiblings.forEach((id)=>
	{
		console.log(id);
		let clientShow  = document.querySelector(`#${id}-messages-container`);
		clientShow.style.display = 'none';
	}) 
	// 
	  chatBlock(currentClient , "true");
  } 
  //
  //chatBlock(clientId , chat);  
}

document.getElementById('create-room').addEventListener('click', () => {
  const roomNameInput = document.getElementById('room-name');
  const roomName = roomNameInput.value;
  roomNameInput.value = '';
	  
  joinRoom(roomName);

});

client.loadchats = joinChat; 
client.loadrooms = joinRoom;

function joinRoom(roomName)
{
	var roomMessages = document.querySelectorAll(".room-messages");
	if (roomMessages !== null) {
	  roomMessages.forEach((roomMessage) => {
		roomMessage.style.display = 'none';
	  });
	}

  // Check if room already exists in the list
  const existingRoom = document.querySelector(`#room-${roomName}`);

  if (!existingRoom) 
  {
	  client.joinRoom(roomName);
	  currentRoom = roomName;
	  const roomsList = document.getElementById('rooms-list');
	  const roomListItem = document.createElement('li');
	  roomListItem.id = `room-${currentRoom}`;
	  roomListItem.textContent = currentRoom;
	  roomsList.appendChild(roomListItem);
	  
	  roomListItem.addEventListener('click', () => {
		  
		currentRoom = roomName;
		var roomMessages = document.querySelectorAll(".room-messages");
		if (roomMessages !== null) {
		  roomMessages.forEach((roomMessage) => {
			roomMessage.style.display = 'none';
		  });
		}
		
		client.joinRoom(currentRoom);
		currentRoom = roomListItem.textContent;
		const roomMessagesList = document.getElementById(`room-${currentRoom}-messages`);
		if (!roomMessagesList) {
		  const roomMessagesContainer = document.createElement('div');
		  roomMessagesContainer.id = `room-${currentRoom}-messages-container`;
		  roomMessagesContainer.classList.add('room-messages');
		  const roomMessagesHeader = document.createElement('h3');
		  roomMessagesHeader.textContent = `Room: ${currentRoom}`;
		  roomMessagesContainer.appendChild(roomMessagesHeader);
		  const roomMessagesListElement = document.createElement('ul');
		  roomMessagesListElement.id = `room-${currentRoom}-messages`;
		  roomMessagesContainer.appendChild(roomMessagesListElement);
		  const inputField = document.createElement('input');
		  inputField.id = `room-${currentRoom}-message`;
		  inputField.type = 'text';
		  inputField.placeholder = 'Enter message';
		  roomMessagesContainer.appendChild(inputField);
		  const sendButton = document.createElement('button');
		  sendButton.textContent = 'Send Message';
		  sendButton.onclick = () => {
			const message = inputField.value;
			client.sendMessage(message, { room: currentRoom });
			inputField.value = '';
		  };
		  roomMessagesContainer.appendChild(sendButton);
		  document.getElementById('rooms-content').appendChild(roomMessagesContainer);
		  
		}
		
		
		let roomShow  = document.querySelector(`#room-${currentRoom}-messages-container`);
		console.log(`room-${currentRoom}-messages-container` , roomShow);
		roomShow.style.display = "block";
		 
	  });	
	  
  }
  
  //
}

