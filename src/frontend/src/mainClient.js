
// Declare a global variable to store the username
let username;
let fromUser;
let partnerName;



// Retrieve the username of the user and display it on the webpage
fetch('/username')
  .then(response => response.json())
  .then(data => {
    username = data.username;
    document.getElementById('username').textContent = username;
  })
  .catch(error => {
    console.error('Error:', error);
  });



// Retrieve the user id and store it in a variable
fetch('/userid')
  .then(response => response.json())
  .then(data => {
    userId = data.userId;
  })
  .catch(error => {
    console.error('Error:', error);
  });



// Hide the popup menu when the page is loaded
const popupMenu = document.querySelector('.popup-menu');
popupMenu.classList.add('hidden');



// Get the HTML elements for the random chat
const randomChatList = document.getElementById('randomMessages');
const randomChatInput = document.getElementById('randomMessageInput');
const randomChatSendButton = document.getElementById('randomSendButton');
const nextChatButton = document.getElementById('nextChatButton');
const reportButton = document.getElementById("reportButton");
const addFriend = document.getElementById('addFriend');


// initialize socket connection
const socket = io.connect('http://localhost:3000/', {
  query: { username }
});



// Allow the user to send a message by pressing the Enter key
randomChatInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    randomChatSendButton.click();
  }
});



// Listen for a click on the random chat send button
randomChatSendButton.addEventListener('click', (e) => {
  e.preventDefault();
  const message = randomChatInput.value;
  // Send the message to the server via socket.io
  socket.emit('chat message send', { message, username });
  // Clear the input field
  randomChatInput.value = '';
});



// Listen for a click on the next button
nextChatButton.addEventListener('click', (e) => {
  e.preventDefault();
  socket.emit('next');
  deleteChatHistory();
  const data = {message: "Looking for a Chat Partner.", timestamp: createTimestamp(), username: "RCA"};
  displayMessage(data);
  partnerName = null;
});



/** Julius ist glücklich */
function createTimestamp() {
  const now = new Date();
  now.setHours(now.getHours() + 1); // add 1 hour to the current time
  const timestamp = now.toISOString().slice(11, 16); // Extract the hours and minutes in ISO format
  return timestamp;
}



// Listen for a click on the add friend button
addFriend.addEventListener('click', (e) => {
  e.preventDefault();
  const addFriendData = {
    user1: username,
    user2: partnerName,
  };
  fetch('/addfriend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(addFriendData)
  })
    .then(response => response.json())
    .then(data => {
    // Display success message as alert
    alert(data.message);
  })
  .catch(error => {
    console.error('Error:', error);
    
  });
});



// delete chats function
function deleteChatHistory() {
  var chatHistory = document.getElementById("randomMessages");
  while (chatHistory.firstChild) {
    chatHistory.removeChild(chatHistory.firstChild);
  }
}



// On receiving a 'room next' event, emit a 'room next' event to the server
socket.on('room next', (data) => {
  socket.emit('room next');
})



// On receiving a 'next-partner' event, emit a 'next-partner' event to the server
socket.on('next-partner', (data) => {
  socket.emit('next-partner');
})



// Listen for a chat message from the server via socket.io
socket.on('chat message receive', (data) => displayMessage(data));

function displayMessage(data) {
  const message = data.message;

  // stores the user message
  const userMessage = message;

  // Get the timestamp of the message from the server
  const timestamp = data.timestamp;

  fromUser = data.username

  // Get the username of the current user
  let username;
  fetch('/username')
    .then(response => response.json())
    .then(data2 => {
      username = data2.username;

      if(!partnerName && (data2.username != fromUser) && fromUser != "RCA"){
        partnerName = fromUser;
      }

      console.log(partnerName)
      // if(data.username != username) {
      //   fromUser = data.username;
      // }
      // else{
      //   fromUser = username;
      // }


      // Create a new list item element for the message
      const chatListItem = document.createElement('p');

      // Create a button element for the message text
      const chatMessageButton = document.createElement('button');
      chatMessageButton.innerText = 'Report';

      // Add an onclick event listener to the button element
      chatMessageButton.onclick = function (event) {
        event.preventDefault();

        // Get the pop-up menu and header elements
        const popupMenu = document.querySelector('.popup-menu');
        const header = document.querySelector('.popup-header');

        // Set the header text with the user message
        header.innerText = userMessage;

        // Show the pop-up menu
        popupMenu.classList.remove('hidden');

        // Reset the input field value to the placeholder text
        const messageInput = document.querySelector('.popup-menu input[type="text"]');
        messageInput.value = '';

        // Get the report button element from the popup menu
        const cancelReportButton = document.getElementById("cancelReportButton")

        // Add an onclick event listener to the cancel report button element
        cancelReportButton.onclick = function (event) {
          event.preventDefault();
          popupMenu.classList.add("hidden");
        }
        
        // Get the report button element from the popup menu
        const reportButton = document.getElementById("reportButton");

        // Add an onclick event listener to the report button element
        reportButton.onclick = function (event) {
          event.preventDefault();
          popupMenu.classList.add("hidden");

          const messageInput = document.querySelector('.popup-menu input[type="text"]');
          const comment = messageInput.value;

          // Create an object with the report data
          const reportData = {
            reporter: username,
            reportedUser: fromUser,
            timestamp: timestamp,
            message: userMessage,
            comment: comment,
          };

          // Send the report data to the server
          fetch('/report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData, null, 2)
          })
            .then(response => response.text())
            .catch(error => {
              console.error('Error:', error);
            });

          // Display a notification
          alert(`User reported!`);

          // Reset the input field value to the placeholder text
          messageInput.value = '';
        };
      };



      // Create a new span element for the message text
      const chatMessageText = document.createElement('span');
      chatMessageText.innerText = `${fromUser}: ${message}`;

      // Create a new span element for the timestamp text
      const chatTimestampText = document.createElement('span');
      chatTimestampText.innerText = timestamp;

      // Create a text node to separate the report button and message
      const separatorTextButton = document.createTextNode('  ');

      // Create a text node to separate the message and timestamp
      const separatorTextTime = document.createTextNode(' | ');

      // Append the message, separator, and timestamp to the list item element
      chatListItem.appendChild(chatMessageButton);
      chatListItem.appendChild(separatorTextButton);
      chatListItem.appendChild(chatTimestampText);
      chatListItem.appendChild(separatorTextTime);
      chatListItem.appendChild(chatMessageText);

      randomChatList.appendChild(chatListItem);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

