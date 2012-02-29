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

// Initialisierung



// Server Logik

/* Client verbindet sich mit Server */
webSocket.sockets.on('connection', function(client) {

    console.log((new Date()) + ' Client hat mit Server connected.');

    /** Client sendet Nachricht an den Server */
    client.on('message', function(data) {
        
        console.log((new Date()) + " Message: " + JSON.stringify(data));

        log.push(data);

        // TODO: Hier muss die Nachricht verwaltet werden!
        var msg = data;

        /** Unnötige Whitespaces entfernen */
        msg.trim();
        /** HTML Tags entfernen, sonst Sicherheitslücke! */
        msg.replace(/<(?:.|\n)*?>/gm, '');

        /** Check ob ein Querystring enthalten ist! */
        if (msg.substring(0, 1) == "/") {
            // Spezieller Query String!
            console.log('Query String eingegangen!!!');

        }
        
        /** HTML String bauen */
        var htmlstr = '<li>' + msg + '</li>';
        
        /** Sendet an alle verbundenen Clienten die Nachricht raus */
        webSocket.sockets.emit('message', htmlstr);

    });

    /** Client beendet Session*/
    client.on('disconnect', function() {
        console.log((new Date()) + ' Client disconnected.');
    });

});