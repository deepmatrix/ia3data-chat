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
var gastname = 'Gast'; // Nur für Ausnahmefälle nötig

/**
 * Messagehistory Log
 * ACHTUNG: Logeinträge werden mit historyArray.add() hinzugefügt.
 * Das ist eine selbst definierte Hilfsfunktion (siehe unten)
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
var farbArray = ['#F80E27', '#F7991D', '#8AD749', '#0D9FD8', '#8469D4'];
farbArray = shuffle(farbArray); // Zufallsreihenfolge

/** Gesamtanzahl der User */
var userGesamt = 0;

/**
 * MessageID. Jede Usermessage hat eine eindeutige ID.
 * So kann der Server potentiell auch die History der Clients beeinflussen.
 */
var mid = 0;


//////////////////////////////////
// Module importieren: ///////////
//////////////////////////////////

var webSocket = require('socket.io').listen(port); // http://socket.io/
var colors = require('colors'); // Farben für die Konsole
var fs = require('fs'); // Filesystem API zum schreiben der Logdateien



//////////////////////////////////
// Chatserver Initialisierung ////
//////////////////////////////////

/** Logging Level von Websockets reduzieren */
webSocket.set('log level', 1);
webSocket.set('heartbeat interval', 60);
webSocket.enable('browser client minification');
webSocket.enable('browser client etag');
webSocket.enable('browser client gzip');

// TODO: Problem Same Origin Policy noch nicht gelöst! Chrome verweigert Dienst.
webSocket.set('origins', '*:*');


console.log(getTime()  + ' SERVER UP AND RUNNING.'.green);

/** Erstellt im Dateisystem eine Logdatei mit aktuellem Datestamp als Dateinamen */
try {

    var logfile = fs.createWriteStream("./log/" + new Date().getTime() + ".txt",
    {flags: "a", encoding: "utf-8"});

} catch(e) {

    console.log(getTime() + ' FEHLER BEIM ERSTELLEN DER LOGDATEI'.red);
    console.log(getTime() + ' ' + e + ''.red);

}


//////////////////////////////////
// Server Logik (via Socket.io) //
//////////////////////////////////

/** Client verbindet sich mit Server */
webSocket.sockets.on('connection', function(client) {

    try {

        // console.dir(client); // Gibt alle Client Infos aus

        /** Client verbindet sich neu mit Server */
        console.log(getTime()  + ' NEUER CLIENT VERBUNDEN. '.green + getIP(client));
        userGesamt += 1;

        /** HISTORY Vergangene Chat-Einträge nachsenden */
        client.emit('history', JSON.stringify(historyArray));

        /** Client neue Farbe zuweisen. Rotiert das FarbArray durch */
        client.farbe = farbArray.pop();
        farbArray.unshift(client.farbe);

    } catch(e) {

            // Schwerer Fehler, sollte nicht passieren! Zerstört Konsistenz des Chats
            console.log(getTime() + ' SCHWERER FEHLER!'.red);
            console.log(getTime() + ' FEHLER BEI CLIENT CONNECT'.red);
            console.log(getTime() + ' ' + e + ''.red);

    }


    /** Client sendet seinen Usernamen */
    client.on('username', function(data) {

        try {

            var msg; // Servermessage
            var obj; // JSON Object
            var json; // JSON String

            if (!data || data.length < 1) { // Sonst stürzt Server ab bei leerer Eingabe.
                data = gastname + '-' + userGesamt;
            }

            data = cleanInput(data); // Input säubern

            /* Stellt sicher dass die Usernamen eindeutig sind */
            if (data in usersonlineSet && data !== client.username ) {
                console.log(getTime()  + ' USERNAME SCHON VORHANDEN'.red);
                data += '-' + userGesamt; // Eindeutige ID anhängen
            }

            if (data === client.username) {

                // Anfrage ignorieren. Username ist identisch

            } else if (client.username){

                // Client hat schon Usernamen, also ändere ihn
        
                var alterUsername = client.username;
                client.username = data;
                delete usersonlineSet[alterUsername]; // Alten Usernamen aus Set löschen
                usersonlineSet[data] = true; // Neuen Usernamen in Set speichern

                msg = alterUsername + ' changed name to ' + client.username;
                
                obj = {
                    zeit: getTime(),
                    servermsg: msg
                };

                /** Objekt in Message Log einfügen */
                historyArray.add(obj);

                /** Objekt in JSON String konvertieren */
                json = JSON.stringify(obj);

                /** Sendet an ALLE verbundenen Clienten den JSON String */
                webSocket.sockets.emit('servermessage', json);
                console.log(obj.zeit + ' ' + msg);
                

            } else {

                // Neuer User
                
                client.username = data;
                usersonlineSet[data] = true; // Neuen Usernamen in Set speichern

                msg = client.username + ' joined the Chat';
                
                obj = {
                    zeit: getTime(),
                    servermsg: msg
                };

                /** Objekt in Message Log einfügen */
                historyArray.add(obj);

                /** Objekt in JSON String konvertieren */
                json = JSON.stringify(obj);

                /** Sendet an ALLE verbundenen Clienten den JSON String */
                webSocket.sockets.emit('servermessage', json);
                console.log(obj.zeit + ' ' + msg);

            }

        } catch(e) {

            console.log(getTime() + ' FEHLER BEI CLIENT USERNAME'.red);
            console.log(getTime() + ' ' + e + ''.red);

        }
        
    });


    /** Client sendet Nachricht an Server */
    client.on('message', function(data) {

        try {

            mid += 1; // MessageID inkrementieren

            /** Eingehende Message verarbeiten */
            data = cleanInput(data); // Input säubern

            if (data) { // Nur wenn Daten gültig

            var obj = {
                mid: mid,
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

            } else {

                console.log(getTime() + ' UNGÜLTIGE MESSAGE DATEN'.red);

            }

        } catch(e) {

            console.log(getTime() + ' FEHLER BEI CLIENT MESSAGE'.red);
            console.log(getTime() + ' ' + e);

            client.disconnect('FEHLER!');

        }

        

    });

    /**
     * Client fragt an welche User online sind
     * Sendet Array mit aktuellen Usern zurück, aber nur den Client der angefragt hat
     */
    client.on('usersonline', function() {

        try {

            console.log(getTime() + ' USERSONLINE ANFRAGE'.green);

            var obj = [];
            
            for (var o in usersonlineSet) {
                obj.push(o);
            }

            var json = JSON.stringify(obj);

            /** Nur an den anfragenden Clienten die Onlineliste schicken! */
            client.emit('usersonline', json);

        } catch(e) {

            console.log(getTime() + ' FEHLER BEI CLIENT USERONLINE ANFRAGE'.red);
            console.log(getTime() + ' ' + e);

        }

    });

    /**
     * Client beendet Verbindung zum Server
     */
    client.on('disconnect', function() {
        
        try {

            console.log(getTime() + ' CLIENT ABGEMELDET.'.green);
            
            var msg = client.username + ' left the chat.';
        
            obj = {
                zeit: getTime(),
                servermsg: msg
            };

            /** Objekt in Message Log einfügen */
            historyArray.add(obj);

            /** Objekt in JSON String konvertieren */
            json = JSON.stringify(obj);

            /** Sendet an ALLE verbundenen Clienten den JSON String */
            webSocket.sockets.emit('servermessage', json);
            console.log( obj.zeit + ' ' + msg);

            delete usersonlineSet[client.username]; // Usernamen aus Useronline Set streichen
        
        } catch(e) {

            console.log(getTime() + ' FEHLER BEI CLIENT DISCONNECT'.red);
            console.log(getTime() + ' ' + e);

        }

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

    // Schreibt Logdatei auf Server
    // TODO: Überschreibt alte Logdateien!
    try {

        logfile.write(JSON.stringify(json) + '\n');
    } catch(e) {

        console.log(getTime() + ' FEHLER BEIM SCHREIBEN DER LOGDATEI'.red);
        console.log(getTime() + ' ' + e);

    }

    this.push(json);

    if (this.length > historysize) {
        this.shift(); // Performance?
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

/**
 * Hilfsfunktion die die IP Adresse und den Port des Clients ermittelt und formatiert
 * @param  {object} client Der Client
 * @return {string}
 */
function getIP(client) {

    var address = '[' + client.handshake.address.address + ':' + client.handshake.address.port + ']';

    return address.yellow;

}