/***********************************/
/* Multiuser Chat via Node.js      */
/* Emanuel Kössel / Simon Heimler  */
/***********************************/

// Parameter:
process.title = 'Node.js Chat'; // Prozess-Titel
var port = 8000; // Server Port

// Variablen:

/**
 * Messagehistory Log
 * @type {Array}
 */
var historyArray = []; // TODO: Muss gelegentlich gesäubert werden!

/**
 * Set mit den Namen aller User die online sind (Nur gefaktes Set)
 * @type {Object}
 */
var usersonlineSet = {};

/**
 * Array mit Farben die Usern zufällig zugewiesen werden
 * @type {Array}
 */
var colorArray = ['#66D9EF', '#79E225', '#FD971C'];
colorArray = shuffle(colorArray); // Zufallsreihenfolge



// Module importieren
var webSocket = require('socket.io').listen(port); /* http://socket.io/ */
var colors = require('colors'); /** Farben für die Konsole */

// Initialisierung
webSocket.set('log level', 1); /** Logging Level von Websockets reduzieren */
console.log(getTime()  + ' SERVER UP AND RUNNING.'.green);

// Server Logik

/* Client verbindet sich mit Server */
webSocket.sockets.on('connection', function(client) {

    /** Client verbindet sich neu mit Server */
    console.log(getTime()  + ' NEUER CLIENT VERBUNDEN.'.green);

    /** HISTORY Vergangene Chat-Einträge nachsenden */
    // TODO: Nur Übergangslösung
    // TODO: Sendet keine Servernachrichten mit.
    var htmlstr = '<div style="color: #999;">';
    htmlstr += historyArray.join('');
    htmlstr += '</div>';
    client.emit('history', htmlstr);

    /** Client Farbe zuweisen */
    client.farbe = colorArray.shift();

    /** Client Uhrzeit "Online seit" zuweisen */
    client.onlinesince = getTime();

    /** Client sendet seinen Usernamen */
    client.on('username', function(data) {

        var msg; // Servermessage
        var obj; // JSON Object
        var json; // JSON String

        if (!data || data.length < 1) { // Sonst stürzt Server ab bei leerer Eingabe.
            data = 'Gast';
        }

        data = cleanInput(data); // Input säubern

        // TODO: Noch kein Prüfung auf doppelte oder ungültige Usernamen!

        if (client.username) { // Client hat schon Usernamen, also ändere ihn

            
            var alterUsername = client.username;
            client.username = data;
            delete usersonlineSet[alterUsername]; // Alten Usernamen aus Set löschen
            usersonlineSet[data] = true; // Neuen Usernamen in Set speichern

            msg = ' ' + alterUsername + ' changed name to ' + client.username;
            
            obj = {
                zeit: getTime(),
                severmsg: msg
            };

            /** Objekt in Message Log einfügen */
            historyArray.push(obj);

            /** Objekt in JSON String konvertieren */
            json = JSON.stringify(obj);

            /** Sendet an ALLE verbundenen Clienten den JSON String */
            webSocket.sockets.emit('servermessage', json);
            console.log( obj.zeit + ' ' + msg);
            

        } else {

            // Neuer User
            client.username = data;
            usersonlineSet[data] = true; // Neuen Usernamen in Set speichern

            msg = ' ' + client.username + ' joined the Chat';
            
            obj = {
                zeit: getTime(),
                severmsg: msg
            };

            /** Objekt in Message Log einfügen */
            historyArray.push(obj);

            /** Objekt in JSON String konvertieren */
            json = JSON.stringify(obj);

            /** Sendet an ALLE verbundenen Clienten den JSON String */
            webSocket.sockets.emit('servermessage', json);
            console.log( obj.zeit + '' + msg);

        }

    });


    /** Client sendet Nachricht an Server */
    client.on('message', function(data) {

        /** Eingehende Message verarbeiten */
        data = cleanInput(data); // Input säubern

        var obj = {
            zeit: getTime(),
            username: client.username,
            farbe: client.farbe,
            msg: data
        };

        console.log(getTime() + ' ' + client.username + ': ' + data);

        /** Objekt in Message Log einfügen */
        historyArray.push(obj);

        /** Objekt in JSON String konvertieren */
        var json = JSON.stringify(obj);

        /** Sendet an ALLE verbundenen Clienten den JSON String */
        webSocket.sockets.emit('message', json);

    });

    /**
     * Client fragt an welche User online sind
     * Gibt Array mit aktuellen Usern zurück
     * @return {JSON}
     */
    client.on('usersonline', function() {

        console.log(getTime() + ' USERSONLINE ANFRAGE');

        var obj = [];
        
        for (var o in usersonlineSet) {
            obj.push(o);
        }

        var json = JSON.stringify(obj);

        /** Nur an den anfragenden Clienten die Onlineliste schicken! */
        client.emit('usersonline', json);

    });

    /** Client beendet Session*/
    client.on('disconnect', function() {
        console.log(getTime() + ' CLIENT ABGEMELDET.'.green);
        
        var msg = client.username + ' left the chat.';

    
        obj = {
            zeit: getTime(),
            severmsg: msg
        };

        /** Objekt in Message Log einfügen */
        historyArray.push(obj);

        /** Objekt in JSON String konvertieren */
        json = JSON.stringify(obj);

        /** Sendet an ALLE verbundenen Clienten den JSON String */
        webSocket.sockets.emit('servermessage', json);
        console.log( obj.zeit + ' ' + msg);

        colorArray.push(client.farbe); // Userfarbe in Array zurückgeben
        delete usersonlineSet[client.username]; // Usernamen aus Useronline Set streichen

    });

});

/** Hilfsfunktion die Uhrzeit im HH:MM Format zurückgibt */
function getTime() {
    var currentTime = new Date();

    function volle(Value) {
        return (Value > 9) ? "" + Value : "0" + Value;
    }

    return '' + volle(currentTime.getHours()) + ':' + volle(currentTime.getMinutes());
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