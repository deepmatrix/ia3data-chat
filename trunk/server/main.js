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

console.info('Node.js Chat START' + new Date());

// Module importieren
var io = require('socket.io').listen(port);

// Initialisierung



// Server Logik

/* Client verbindet sich mit Server */
io.sockets.on('connection', function(client) {

    console.log((new Date()) + ' Client hat mit Server connected.');

    /** Client sendet Nachricht an den Server */
    client.on('message', function(data) {
        
        console.log((new Date()) + " Message: " + JSON.stringify(data));

        log.push(data);
        
        client.broadcast.emit('message', JSON.stringify(data));

    });

    /** Client beendet Session*/
    client.on('disconnect', function() {
        console.log((new Date()) + ' Client disconnected.');
    });

});