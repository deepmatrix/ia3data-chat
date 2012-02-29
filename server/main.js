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
var webSocket = require('socket.io').listen(port);
var message = require('./message');

// Initialisierung



// Server Logik

/* Client verbindet sich mit Server */
webSocket.sockets.on('connection', function(client) {

    console.log((new Date()) + ' Client hat mit Server connected.');

    var clientname = 'Anon';

    /** Client sendet Nachricht an den Server */
    client.on('message', function(data) {

        /** Eingehende Message verarbeiten */
        var htmlstr = message.processMsg(data);
  
        console.log((new Date()) + " Message: " + htmlstr);

        /** In Message Log einfügen */
        log.push(htmlstr);

        /** Sendet an alle verbundenen Clienten die Nachricht raus */
        webSocket.sockets.emit('message', htmlstr);

    });

    /** Client beendet Session*/
    client.on('disconnect', function() {
        console.log((new Date()) + ' Client disconnected.');
        console.log(log);
    });

});