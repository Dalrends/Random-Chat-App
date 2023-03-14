
// Import required packages and modules
const { Pool } = require('pg'); // PostgreSQL client for Node.js
const express = require("express"); // web framework for Node.js
const bodyParser = require('body-parser'); // middleware for parsing request body
const cors = require('cors') // middleware for enabling CORS
const jwt = require('jsonwebtoken'); // package for generating and verifying JSON web tokens
const path = require('path'); // module for working with file paths
const app = express(); // create an instance of the express app
const http = require('http'); // built-in Node.js module for creating HTTP server
const PORT = 3000; // port number for the server to listen on
const server = http.createServer(app); // create a new HTTP server using the express app
const socketIO = require('socket.io'); // package for real-time, bidirectional communication between client and server
const io = socketIO(server); // create a new socket.io instance using the HTTP server
const bcrypt = require('bcrypt'); // package for password hashing
const session = require('express-session'); // middleware for session management
const crypto = require('crypto'); // package for cryptography
const fs = require('fs'); // built-in Node.js module for working with the file system



// Generate a random secret key
const secret = crypto.randomBytes(64).toString('hex');



// Session middleware
app.use(session({
    secret: secret, // session secret key
    resave: true, // forces the session to be saved back to the session store
    saveUninitialized: true // saves the session even if it's new and hasn't been modified
}));



// Middleware
app.use(bodyParser.json()); // parse JSON request bodies
app.use(cors()); // enable Cross-Origin Resource Sharing (CORS)
app.use(express.json()); // parse JSON request bodies (alternative method)
app.use(express.static(path.join(__dirname, '/frontend/dist'))); // serve static files from the specified directory
app.use(express.static(path.join(__dirname, '/frontend/src'))); // serve static files from the specified directory



// Connect to the PostgreSQL database
const pgPool = new Pool({
    user: "postgres",
    database: "Tsch",
    password: "postgres",
    port: 5432,
    host: "localhost",
});
// establish a connection to the database
pgPool.connect();



let rooms = [] // rooms for users to chat
let queue = [] // queue for users waiting to chat



// create new room for users to chat
function createNewRoom(){
    let roomID;
    // generate a random room ID until a unique one is found
    do{
        roomID = Math.random();
    } while (rooms.find(id => id == roomID));
    // add the new room ID to the list of active rooms
    rooms.push(roomID);
    return roomID;
}



// Socket.io event handlers
io.on('connection', (socket) => {
    socket.leave(socket.id);
    console.log('A user connected');
    queue.push(socket); // add the new socket to the queue
    printRoomsAndQueue()

    socket.emit('chat message receive', { message: "Looking for a Chat Partner.",timestamp: createTimestamp(), username: "RCA" });

    matchUsers(); // attempt to match users and start a chat

    // handler for when a user disconnects
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        queue = queue.filter(sock => sock.id != socket.id); // remove the disconnected user from the queue


    });
});



// event handler for when a user joins a room
io.of("/").adapter.on("join-room", (room, id) => {
});



// event handler for when a user leaves a room
io.of("/").adapter.on("leave-room", (room, id) => {
    console.log(`socket ${id} has left room ${room}`);
    // send a message to the remaining user in the room that their partner has left
    sendMessageToSockets(room, "RCA", "Partner left, press NEXT to find new Partner");
    io.to(room).emit('next partner') // trigger the next partner event on the remaining user's socket
    printRoomsAndQueue();
});



/** Julius ist glücklich */
function createTimestamp() {
    const now = new Date();
    now.setHours(now.getHours() + 1); // add 1 hour to the current time
    const timestamp = now.toISOString().slice(11, 16); // Extract the hours and minutes in ISO format
    return timestamp;
}



// match users, main socket function
function matchUsers() {
    // Check if there are at least two users in the queue
    if (queue.length >= 2) {
        // Get the first two users in the queue and create a new room for them
        const duo = queue.splice(0, 2);
        let roomID = createNewRoom();
        duo[0].join(roomID);
        duo[1].join(roomID); // 2nd user join 1st users room
        console.log("Users joined Room: ", roomID);
        printRoomsAndQueue();
        // Notify the users that they have found a partner and can start chatting
        sendMessageToSockets(roomID, "RCA", "You found a Partner! Start chatting!");

        // Add chat message send and next-partner event listeners for both users
        duo.forEach(sock => {
            sock.on('chat message send', (data) => {
                console.log('message: ' + data.message);
                sendMessageToSockets(roomID, data.username, data.message);
            });

            // Triggered when a user's partner leaves
            sock.on('next-partner', () => {
                console.log("### ROM NEXT KOMMT AN");
                sock.leave(roomID);
                sock.removeAllListeners('next-partner');
                sock.removeAllListeners('chat message send');
                sendMessageToSockets(roomID, "RCA", "Partner left, press NEXT to find new Partner"); // send the message and timestamp to all connected clients
            });

            // Triggered when a user presses the "next" button to find a new partner
            sock.on('next', () => {
                console.log("### NEXT KOMMT AN  ", sock.id);
                sock.leave(roomID);
                printRoomsAndQueue();

                // Notify the users that their partner has left and that they can search for a new one
                io.in(roomID).emit('next-partner');
                sock.removeAllListeners('next-partner');
                sock.removeAllListeners('next');
                sock.removeAllListeners('chat message send');
                queue.push(sock);
                matchUsers(); // try to match the next users in the queue
            });
        });
    }
}



// Debugging function to print out queue, room IDs, and rooms object
function printRoomsAndQueue() {
    console.log("Queue: ", queue.map(sock => sock.id));
    console.log("RoomIDs: ", rooms);
    console.log("Rooms: ", io.of("/").adapter.rooms);
    console.log("###########################")
}



// Function to send a message to all sockets in a room
function sendMessageToSockets(roomID, username, message) {
    const now = new Date();
    now.setHours(now.getHours() + 1); // add 1 hour to the current time
    const timestamp = now.toISOString().slice(11, 16); // Extract the hours and minutes in ISO format
    // Send the message to all sockets in the room
    io.to(roomID).emit('chat message receive', { message, timestamp, username });
  }



// Function to hash the user's password during registration
async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}



// This function retrieves the hashed password for a given username from the database
async function getHashedPasswordFromDatabase(username) {

    // Create a query to select the password column from the users table where the username matches
    const hashQuery = {
        text: "SELECT password FROM users WHERE username = $1",
        values: [username],
    };

    // Execute the query and get the result
    const hashResult = await pgPool.query(hashQuery);

    // If there is no result, return null
    if (hashResult.rows.length === 0) {
        return null;
    }

    // If there is a result, return the hashed password
    return hashResult.rows[0].password;
}



// Define routes
// Route for the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/frontend/dist/login.html')); // serve the login HTML file
});



// Route for the main page
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, '/frontend/dist/main.html')); // serve the main HTML file
});



// Route to retrieve username from session
app.get('/username', (req, res) => {
    const username = req.session.username;
    res.json({ username });
});



// Route to retrieve user id from session
app.get('/userid', (req, res) => {
    const userId = req.session.userId;
    res.json({ userId });
});


// This function handles adding a friend for a given user
app.post('/addfriend', async (req, res) => {
    // Get the usernames of the users involved from the request body
    const { user1, user2 } = req.body;
  
    // Query the database to get the IDs of the users involved
    const userId = await pgPool.query('SELECT id FROM users WHERE lower(username) = lower($1)', [user1]);
    const friendUserId = await pgPool.query('SELECT id FROM users WHERE lower(username) = lower($1)', [user2]);
  
    // Extract the user IDs from the query results
    const test = userId.rows[0].id;
    const test2 = friendUserId.rows[0].id;
  
    // Check if a friendship between the two users already exists
    const existingFriendship = await pgPool.query(
      'SELECT * FROM friends WHERE (user_id = $1 AND friend_user_id = $2) OR (user_id = $2 AND friend_user_id = $1)',
      [test, test2]
    );
        
    // If a friendship already exists, return a message
    if (existingFriendship.rows.length > 0) {
      res.status(400).json({ message: `You are already friends with ${user2}!` });
      return;
    }
  
    // Add the new friendship to the database
    const addFriendsInDB = await pgPool.query(
      'INSERT INTO friends (user_id, friend_user_id) VALUES ($1, $2)',
      [test, test2]
    );
  
    // Return a success message
    res.status(200).json({ message: `You are now friends with ${user2}!` });
});



// POST endpoint for reporting a message
app.post('/report', (req, res) => {
    const report = req.body;
    const reportData = {
      reporter: report.reporter,
      reportedUser: report.reportedUser,
      timestamp: report.timestamp,
      message: report.message,
      comment: report.comment,
    };
 
    // Read the existing report data from the JSON file
    fs.readFile('src/reports.json', (err, data) => {
        if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error'); // Return 500 error if an error occurs while reading the file
        }
  
    let reports = [];
    if (data.length > 0) { // Check if the file contains data
        reports = JSON.parse(data); // Parse the data from JSON string to object
    }
  
    reports.push(reportData); // Add the new report data to the existing data

    // Write the updated report data to the JSON file
    fs.writeFile('src/reports.json', JSON.stringify(reports), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error'); // Return 500 error if an error occurs while writing the file
      }
  
      return res.status(200).send('Report saved successfully'); // Return success status and message if the file is written successfully
    });
  });
});



// register
app.post("/register", async (req, res) => {
    const { registerUsername, registerPassword } = req.body;
    const hashedRegisterPassword = await hashPassword(registerPassword);

    // check if username already exists
    try {
        const checkIfUsernameExists = await pgPool.query('SELECT * FROM users WHERE lower(username) = lower($1)', [registerUsername]);
        if (checkIfUsernameExists.rows.length > 0) { // check if the username already exists
            res.status(409).json({ message: "Username already exists!" });
            return;
        }

        // save user registration data to database
        const registerResult = await pgPool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2)', [registerUsername, hashedRegisterPassword]);

        res.status(201).json({ message: "Registration complete!" }); // return success message
    } catch (err) {
        console.error(err); // log error to console
        res.status(500).json({ message: "Error!" }); // return error message
    }
});



// login
app.post("/login", async (req, res) => {
    // Extract the login credentials from the request body
    const { loginUsername, loginPassword } = req.body;

    // Check if the given username exists in the database and get the hashed password
    const hashedPassword = await getHashedPasswordFromDatabase(loginUsername);

    // If the username does not exist, return an error message
    if (!hashedPassword) {
        res.status(403).json({ message: "Invalid username or password" });
        return;
    }

    // Check if the given password matches the hashed password from the database
    const match = await bcrypt.compare(loginPassword, hashedPassword);
    if (match) {
        // If the passwords match, generate a JSON web token (JWT) and set it as a cookie in the response
        const token = jwt.sign({ username: loginUsername, timestamp: Date.now() }, Math.random().toString(36).substring(2), { expiresIn: "1d" });
        res.cookie('jwt', token, { maxAge: 86400000, httpOnly: true }); // set cookie with JWT

        // Set the username and user ID in the session
        req.session.username = loginUsername;
        const loginUserId = await pgPool.query('SELECT id FROM users WHERE lower(username) = lower($1)', [loginUsername]);
        req.session.userId = loginUserId.rows[0];

        // Return a success message and redirect to the main page
        res.status(200).json({
            message: "Login successful!",
            redirectUrl: "http://localhost:3000/main.html"
        });
    } else {
        // If the passwords do not match, return an error message
        res.status(403).json({ message: "Invalid username or password" });
    }
});



// start the server on the specified port
server.listen(PORT, () => {
    console.log("Mein erster Server sagt: Chaka! Die Waldfee!")
});
