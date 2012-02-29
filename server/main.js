/***********************************/
/* Multiuser Chat via Node.js      */
/* Emanuel Kössel / Simon Heimler  */
/***********************************/

// Parameter:
process.title = 'Node.js Chat'; // Prozess-Titel
var port = 8000; // Server Port

// Variablen:
/** Messagehistory */

/**
 * Messagehistory Log
 * @type {Array}
 */
var historyArray = []; // TODO: Muss gelegentlich gesäubert werden!

/**
 * Set mit den Namen aller User die online sind
 * @type {Object}
 */
var usersonlineSet = {};

/**
 * Array mit Farben die Usern zufällig zugewiesen werden
 * @type {Array}
 */
var colorArray = ['#66D9EF', '#79E225', '#FD971C'];
colorArray = shuffle(colorArray); // Zufallsreihenfolge

console.info(getTime() + ' Node.js Chat START ');

// Module importieren
var webSocket = require('socket.io').listen(port);

// Initialisierung
webSocket.set('log level', 1); /** Logging Level von Websockets reduzieren */

// Server Logik

/* Client verbindet sich mit Server */
webSocket.sockets.on('connection', function(client) {

    /** Client verbindet sich neu mit Server */
    console.log(getTime()  + ' NEUER CLIENT VERBUNDEN.');

    /** HISTORY Vergangene Chat-Einträge nachsenden */
    // TODO: Nur Übergangslösung
    // TODO: Sendet keine Servernachrichten mit.
    var htmlstr = '<div style="color: #999;">';
    htmlstr += historyArray.join('');
    htmlstr += '</div>';
    client.emit('history', htmlstr);

    /** Client Farbe zuweisen */
    client.farbe = colorArray.shift();

    /** Client sendet seinen Usernamen */
    client.on('username', function(data) {

        var msg; // Servermessage

        if (!data || data.length < 1) { // Sonst stürzt Server ab bei leerer Eingabe.
            data = 'Gast';
        }

        data = cleanInput(data); // Input säubern
        
        console.log(getTime() + ' USERNAME GESETZT: ' + data);

        

        // TODO: Noch kein Prüfung auf doppelte oder ungültige Usernamen!

        if (client.username) {

            // Hat schon Usernamen (Ändert Namen)
            var alterUsername = client.username;
            client.username = data;

            msg = getTime() + ' ' + alterUsername + ' changed name to ' + client.username;
            webSocket.sockets.emit('servermessage', msg);

            delete usersonlineSet[alterUsername]; // Alten Usernamen aus Set löschen
            usersonlineSet[data] = true; // Neuen Usernamen in Set speichern

        } else {

            // Neuer User
            client.username = data;
            usersonlineSet[data] = true; // Neuen Usernamen in Set speichern

            msg = getTime() + ' ' + client.username + ' joined the Chat';
            webSocket.sockets.emit('servermessage', msg);

        }

    });


    /** Client sendet Nachricht an Server */
    client.on('message', function(data) {

        // TODO: Als JSON verschicken

        /** Eingehende Message verarbeiten */
        var msg = '';

        data = cleanInput(data); // Input säubern

        msg += '<li>' + getTime() + ' ' + client.username + ': ' + data + '</li>';
  
        console.log(getTime() + " Message: " + msg);

        /** In Message Log einfügen */
        historyArray.push(htmlstr);

        /** Sendet an alle verbundenen Clienten die Nachricht raus */
        webSocket.sockets.emit('message', msg);

    });

    /** Client fragt an welche User online sind */
    client.on('usersonline', function(data) {

        console.log(getTime() + ' USERSONLINE ANFRAGE');

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
        console.log(getTime() + ' CLIENT ABGEMELDET.');
        
        var msg = client.username + ' left the chat.';
        webSocket.sockets.emit('servermessage', msg);


        colorArray.push(client.farbe); // Userfarbe in Array zurückgeben
        delete usersonlineSet[client.username]; // Usernamen aus Useronline Set streichen

    });

});

/** Hilfsfunktion die Uhrzeit im HH:MM Format zurückgibt */
function getTime() {
    var currentTime = new Date();
    return '' + currentTime.getHours() + ':' + currentTime.getMinutes();
}

function cleanInput(data) {
    data = data.trim(); /** Whitespaces entfernen */
    data = data.replace(/<(?:.|\n)*?>/gm, ''); /** HTML Tags entfernen, sonst Sicherheitslücke! */
    return data;
}

// http://stackoverflow.com/questions/962802/is-it-correct-to-use-javascript-array-sort-method-for-shuffling
function shuffle(array) {
    var tmp, current, top = array.length;

    if(top) while(--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }

    return array;
}