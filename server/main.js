/***********************************/
/* Multiuser Chat via Node.js      */
/* Emanuel Kössel / Simon Heimler  */
/***********************************/

// Parameter:
process.title = 'Node.js Chat'; // Prozess-Titel
var port = 8000; // Server Port
var guestName = 'Gast';

// Variablen:
/** Messagehistory */
var historyArray = [];
/** Verbundene Clients */
var usersonlineArray = [];
/** Standardfarben */
var colorArray = ['#66D9EF', '#79E225', '#FD971C'];

console.info(getTime() + ' Node.js Chat START ');

// Module importieren
var webSocket = require('socket.io').listen(port);
var message = require('./message');

// Initialisierung
webSocket.set('log level', 1); /** Logging Level von Websockets reduzieren */

// Server Logik

/* Client verbindet sich mit Server */
webSocket.sockets.on('connection', function(client) {

    /** Client verbindet sich neu mit Server */
    client.username = guestName;
    console.log(client.username);
    console.log(getTime()  + ' Client hat mit Server connected.');

    /** Vergangene Chat-Einträge nachsenden */
    // TODO: Nur Übergangslösung
    var htmlstr = '<div style="color: #777;">';
    htmlstr += log.join('');
    htmlstr += '</div>';
    client.emit('history', htmlstr);

    /** Client sendet seinen Usernamen */
    client.on('username', function(data) {

        console.log("USERNAME SENT");

        // TODO
        webSocket.sockets.emit('servermessage', webSocket.sockets.toString());

    });


    /** Client sendet Nachricht an Server */
    client.on('message', function(data) {

        /** Eingehende Message verarbeiten */
        var htmlstr = message.processMsg(client, data, usersonlineArray);
  
        console.log(getTime() + " Message: " + htmlstr);

        /** In Message Log einfügen */
        log.push(htmlstr);

        /** Sendet an alle verbundenen Clienten die Nachricht raus */
        webSocket.sockets.emit('message', htmlstr);

    });

    /** Client fragt an welche User online sind */
    client.on('usersonline', function(data) {

        console.log("USERSONLINE ANFRAGE");

        // TODO
        webSocket.sockets.emit('usersonline', webSocket.sockets.toString());

    });

    /** Client beendet Session*/
    client.on('disconnect', function() {
        console.log(getTime() + ' Client disconnected.');
        console.log(log);

        var htmlstr = '<li>' + client.username + ' left the chat.</li>';
        webSocket.sockets.emit('message', htmlstr);
    });

});

/** Hilfsfunktion die Uhrzeit im HH:MM Format zurückgibt */
function getTime() {
    var currentTime = new Date();
    return '' + currentTime.getHours() + ':' + currentTime.getMinutes();
}