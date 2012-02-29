/***********************************/
/* Multiuser Chat via Node.js      */
/* Emanuel Kössel / Simon Heimler  */
/***********************************/

// Parameter:
process.title = 'Node.js Chat'; // Prozess-Titel
var port = 8000; // Server Port

// Variablen:
/** Messagehistory */
var historyArray = [];
/** Verbundene Clients */
var usersonlineSet = {};
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
    console.log(getTime()  + ' Client hat mit Server connected.');

    /** HISTORY Vergangene Chat-Einträge nachsenden */
    // TODO: Nur Übergangslösung
    // TODO: Sendet keine Servernachrichten mit.
    
    var htmlstr = '<div style="color: #777;">';
    htmlstr += historyArray.join('');
    htmlstr += '</div>';
    client.emit('history', htmlstr);

    /** Client sendet seinen Usernamen */
    client.on('username', function(data) {

        var msg; // Servermessage

        if (data.length < 1) { // Sonst stürzt Server ab bei leerer Eingabe.
            data = 'Gast';
        }

        console.log("USERNAME SENT: " + data);

        // TODO: In eigene Funktion auslagern
        data = data.trim(); /** Whitespaces entfernen */
        data = data.replace(/<(?:.|\n)*?>/gm, ''); /** HTML Tags entfernen, sonst Sicherheitslücke! */

        // TODO: Noch kein Prüfung auf doppelte oder ungültige Usernamen!

        if (client.username) {

            // Hat schon Usernamen (Ändert Namen)
            var alterUsername = client.username;
            client.username = data;

            msg = alterUsername + ' changed name to ' + client.username;
            webSocket.sockets.emit('servermessage', msg);

            delete usersonlineSet[alterUsername]; // Alten Usernamen aus Set löschen
            usersonlineSet[data] = true; // Neuen Usernamen in Set speichern

        } else {

            // Neuer User
            client.username = data;
            usersonlineSet[data] = true; // Neuen Usernamen in Set speichern

            msg = client.username + ' joined the Chat';
            webSocket.sockets.emit('servermessage', msg);

        }

    });


    /** Client sendet Nachricht an Server */
    client.on('message', function(data) {

        // TODO: Als JSON verschicken

        /** Eingehende Message verarbeiten */
        var htmlstr = message.processMsg(client, data);
  
        console.log(getTime() + " Message: " + htmlstr);

        /** In Message Log einfügen */
        historyArray.push(htmlstr);

        /** Sendet an alle verbundenen Clienten die Nachricht raus */
        webSocket.sockets.emit('message', htmlstr);

    });

    /** Client fragt an welche User online sind */
    client.on('usersonline', function(data) {

        console.log("USERSONLINE ANFRAGE");

        // TODO: Als JSON verschicken
        var useronlinelist = '';

        for (var username in usersonlineSet) {
            useronlinelist += '<li>';
            useronlinelist += username;
            useronlinelist += '</li>';
        }

        /** Nur an den anfragenden Clienten die Onlineliste schicken! */
        client.emit('usersonline', useronlinelist);

    });

    /** Client beendet Session*/
    client.on('disconnect', function() {
        console.log(getTime() + ' Client disconnected.');
        
        var msg = client.username + ' left the chat.';
        webSocket.sockets.emit('servermessage', msg);

        delete usersonlineSet[client.username];

    });

});

/** Hilfsfunktion die Uhrzeit im HH:MM Format zurückgibt */
function getTime() {
    var currentTime = new Date();
    return '' + currentTime.getHours() + ':' + currentTime.getMinutes();
}