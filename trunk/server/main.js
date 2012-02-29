/***********************************/
/* Multiuser Chat via Node.js      */
/* Emanuel Kössel / Simon Heimler  */
/***********************************/

// Parameter:
process.title = 'Node.js Chat'; // Prozess-Titel
var port = 8000; // Server Port


// Variablen:
/** Messagehistory */
var log = [];
/** Verbundene Clients */
var clients = [];
/** Standardfarben */
var colors = ['#66D9EF', '#79E225', '#FD971C'];


// Module importieren
// var http = require('http');
var io = require('socket.io').listen(port);
// var processing = require('processing');

// var server = http.createServer(function(req, res) {
//     // Erstmal nichts zu tun.
// });


// Initialisierung
// server.listen(port);
// var socket = io.listen(server);

// Server Logik
// io.sockets.on('connection', function (socket) {
//   socket.broadcast.emit('user connected');
// });

io.sockets.on('connection', function( client ) {

    console.info('Client hat mit Server connected.');

    client.on('message', function(data) {
        
        console.log("Message: " + JSON.stringify(data));
        socket.broadcast(data);

    });

    client.on('disconnect', function() {

    });

});