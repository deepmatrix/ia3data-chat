////////////////////////////////////////////////////
// Multiuser Chat via Node.js und Socket.io       //
////////////////////////////////////////////////////
// Ein Projekt von Emanuel Kössel & Simon Heimler //
// 2012 > FH Augsburg > IAM3 > ia3.Netz & Data    //
////////////////////////////////////////////////////



//////////////////////////////////
// Parameter und Variablen: //////
//////////////////////////////////

process.title = 'Node.js Chat'; // Prozess-Titel
var port = 8000; // Server Port
var historysize = 10; // Länge der History im Arbeitsspeicher

/**
 * Messagehistory Log
 * @type {Array}
 */
var historyArray = [];

/**
 * Set mit den Namen aller User die online sind (Nur gefaktes Set)
 * @type {Object}
 */
var usersonlineSet = {};

/**
 * Array mit Farben die Usern zufällig zugewiesen werden
 * @type {Array}
 */
var farbArray = ['#66D9EF', '#79E225', '#FD971C'];
farbArray = shuffle(farbArray); // Zufallsreihenfolge



//////////////////////////////////
// Module importieren: ///////////
//////////////////////////////////

var webSocket = require('socket.io').listen(port); /* http://socket.io/ */
var colors = require('colors'); /** Farben für die Konsole */



//////////////////////////////////
// Chatserver Initialisierung ////
//////////////////////////////////

webSocket.set('log level', 1); /** Logging Level von Websockets reduzieren */
console.log(getTime()  + ' SERVER UP AND RUNNING.'.green);



//////////////////////////////////
// Server Logik (via Socket.io) //
//////////////////////////////////

/** Client verbindet sich mit Server */
webSocket.sockets.on('connection', function(client) {

    /** Client verbindet sich neu mit Server */
    console.log(getTime()  + ' NEUER CLIENT VERBUNDEN.'.green);

    /** HISTORY Vergangene Chat-Einträge nachsenden */
    client.emit('history', JSON.stringify(historyArray));

    /** Client neue Farbe zuweisen. Rotiert das FarbArray durch */
    client.farbe = farbArray.pop();
    farbArray.unshift(client.farbe);


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
            historyArray.add(obj);

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
            historyArray.add(obj);

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
        historyArray.add(obj);

        /** Objekt in JSON String konvertieren */
        var json = JSON.stringify(obj);

        /** Sendet an ALLE verbundenen Clienten den JSON String */
        webSocket.sockets.emit('message', json);

    });

    /**
     * Client fragt an welche User online sind
     * Sendet Array mit aktuellen Usern zurück, aber nur den Client der angefragt hat
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

    /**
     * Client beendet Verbindung zum Server
     */
    client.on('disconnect', function() {
        console.log(getTime() + ' CLIENT ABGEMELDET.'.green);
        
        var msg = client.username + ' left the chat.';

    
        obj = {
            zeit: getTime(),
            severmsg: msg
        };

        /** Objekt in Message Log einfügen */
        historyArray.add(obj);

        /** Objekt in JSON String konvertieren */
        json = JSON.stringify(obj);

        /** Sendet an ALLE verbundenen Clienten den JSON String */
        webSocket.sockets.emit('servermessage', json);
        console.log( obj.zeit + ' ' + msg);

        delete usersonlineSet[client.username]; // Usernamen aus Useronline Set streichen

    });

});


//////////////////////////////////
// Hilfsfunktionen ///////////////
//////////////////////////////////

/**
 * Hilfsfunktion die Uhrzeit im HH:MM Format zurückgibt
 * @return {string}
 */
function getTime() {
    var currentTime = new Date();

    function volle(Value) {
        return (Value > 9) ? "" + Value : "0" + Value;
    }

    return '' + volle(currentTime.getHours()) + ':' + volle(currentTime.getMinutes());
}

/**
 * Definiert neue Funktion auf dem historyArray um neue Logeinträge einzufügen.
 * Wenn die History größer ist als in var historysize angegeben kürze sie.
 * @param  {JSON} json JSON Objekt
 */
historyArray.add = function(json) {

    this.push(json);

    if (this.length > historysize) {
        this.shift();
    }
};

/**
 * Hilfsfunktion die empfangene Daten verarbeitet:
 * - Whitespace vorne und hinten entfernen
 * - HTML Tags entfernen (Sicherheitsfeature!)
 * @param  {string} data Vom Client empfangene Daten
 * @return {string}
 */
function cleanInput(data) {
    data = data.trim(); /** Whitespaces entfernen */
    data = data.replace(/<(?:.|\n)*?>/gm, ''); /** HTML Tags entfernen, sonst Sicherheitslücke! */
    return data;
}

/**
 * Array zufällig neuordnen
 * http://stackoverflow.com/questions/962802/is-it-correct-to-use-javascript-array-sort-method-for-shuffling
 * @param  {[]} array Array der neugemischt werden soll.
 * @return {[type]}
 */
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