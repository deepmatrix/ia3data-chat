////////////////////////////////////////////////////
// Multiuser Chat via Node.js und Socket.io       //
// http://code.google.com/p/ia3data-chat/         //
////////////////////////////////////////////////////
// Ein Projekt von Emanuel Kössel & Simon Heimler //
// 2012 > FH Augsburg > IAM3 > ia3.Netz & Data    //
////////////////////////////////////////////////////


//////////////////////////////////
// Parameter und Variablen: //////
//////////////////////////////////

process.title = 'Node.js Chat Server'; // Prozess-Titel
var port = 8000; // Server Port
var historysize = 25; // Länge der History im Arbeitsspeicher (Array)
var gastname = 'Gast'; // Nur in Ausnahmefällen nötig
var DEBUG = false; // Schaltet DEBUG Modus an oder aus
var FILELOG = false; // Schaltet das Schreiben der Logdateien ins Dateisystem an oder aus

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

/**
 * UserID. Jeder User hat eine eindeutige ID.
 * Ist auch Gesamtanzahl der User insgesamt (Aber nicht aktuell online!)
 * So kann der Server potentiell die User verwalten (Bannen, etc.)
 */
var uid = 1;

/**
 * MessageID. Jede Usermessage hat eine eindeutige ID. Gesamtzahl der Messages.
 * So kann der Server potentiell auch die History der Clients beeinflussen.
 */
var mid = 1;


//////////////////////////////////
// Module importieren: ///////////
//////////////////////////////////

var http = require('http').createServer(httphandler).listen(port); // HTTP Server
var io = require('socket.io').listen(http); // Transport Modul. "Sitzt" auf HTTP Server (http://socket.io/)
var colors = require('colors'); // Farben für die Konsole (https://github.com/marak/colors.js)
var fs = require('fs'); // Filesystem API zum senden des Clients und schreiben der Logdateien

var utilities = require('./utilities.js'); // Eigenes Utilitys Modul importieren
var getTime = utilities.getTime; // getTime() Funktion in globalen Namespace importieren


//////////////////////////////////
// HTTPserver Initialisierung ////
//////////////////////////////////

/**
 * Nimmt HTTP Anfragen entgegen und liefert den Client in HTML zurück
 * Socket.IO ist an den HTTP Server gebunden
 * Orientiert sich an einem Beispiel von http://socket.io/#how-to-use
 */
function httphandler(request, response) {
 
    console.log(getTime()  + ' LIEFERE CLIENT HTML.'.green);
    
    /** List die Client HTML ein und gibt sie bei jeder HTTP Anfrage aus */
    fs.readFile(__dirname + '/client/testclient.htm', function(error, data) {

        // TODO: Liefert aktuell nur Testclient aus!
        
        if (error) {

            response.writeHead(500);

            console.log(getTime() + ' FEHLER BEIM SENDEN DES CLIENTS'.red);
            console.log(getTime() + error.toString());

            return response.end('Error loading index.html');

        } else {

            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(data, 'utf-8');
        }
    });
     
}


//////////////////////////////////
// Chatserver Initialisierung ////
//////////////////////////////////

// Socket.io Konfiguration: https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO

/** Logging Level von Websockets reduzieren */
io.set('log level', 1);
if (DEBUG) {io.set('log level', 3);}

/** Timeouts weniger aggressiv einstellen: */
io.set('close timeout', 120);
io.set('heartbeat timeout', 120);
io.set('heartbeat interval', 30);

/** Wahl und Reihenfolge der zu verwendenden Transport Protokolle */
io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);

/** Kompression etc. */
io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file

// TODO: Problem Same Origin Policy noch nicht gelöst! Chrome verweigert Dienst.
// Die Dateien auf einem Apache Server ausliefen und die URLs entsprechend anpassen löst das Problem!
io.set('origins', '*:*');

/** Farbarray zufällig neuordnen */
farbArray = utilities.shuffle(farbArray); // Zufallsreihenfolge

/** Erstellt im Dateisystem eine Logdatei mit aktuellem Datestamp als Dateinamen */
if (FILELOG) {

    try {

        var logfile = fs.createWriteStream(__dirname + '/log/' + new Date().getTime() + ".txt",
        {flags: "a", encoding: "utf-8"});

    } catch(e) {

        console.log(getTime() + ' FEHLER BEIM ERSTELLEN DER LOGDATEI'.red);
        console.log(getTime() + ' ' + e);

    }
}

console.log(getTime()  + ' SERVER UP AND RUNNING.'.green);


////////////////////////////////////////
// Server Transport Logik (Socket.io) //
////////////////////////////////////////

/** Client verbindet sich mit Server */
io.sockets.on('connection', function(client) {

    try {

        if (DEBUG) { console.dir(io.sockets);} // Gibt alle Client Infos aus

        if (DEBUG) { console.dir(client);} // Gibt alle Client Infos aus

        /** Client verbindet sich neu mit Server */
        console.log(getTime()  + ' NEUER CLIENT VERBUNDEN. '.green + utilities.getIP(client));
        uid += 1;
        client.uid = uid; // Client die uid intern zuweisen

        /** HISTORY Vergangene Chat-Einträge nachsenden */
        client.emit('history', JSON.stringify(historyArray));

        /** Client neue Farbe zuweisen. Rotiert das FarbArray durch */
        client.farbe = farbArray.pop();
        farbArray.unshift(client.farbe);

    } catch(e) {

            console.log(getTime() + ' FEHLER BEI CLIENT CONNECT!'.red);
            console.log(getTime() + ' ' + e);

    }


    /** Client sendet seinen Usernamen */
    client.on('username', function(data) {

        try {

            var msg; // Servermessage
            var obj; // JSON Object
            var json; // JSON String

            /** Stellt sicher dass User einen gültigen Usernamen hat falls der Client dabei fehlschlägt */
            if (!data || data.length < 1) {
                data = gastname + '-' + uid;
            }

            /** Ruft Hilfsfunktion auf, die die empfangenen Daten "säubert" */
            data = utilities.cleanInput(data);

            /**
             * Stellt sicher dass die Usernamen eindeutig sind
             * Falls Username schon vorhanden, hänge UserID an.
             */
            if (data in usersonlineSet && data !== client.username ) {
                console.log(getTime()  + ' USERNAME SCHON VORHANDEN'.yellow);
                data += '-' + uid; // Eindeutige ID anhängen
            }

            if (data === client.username) {

                // Anfrage ignorieren. Username ist identisch

            } else if (client.username){

                // Vorhandener User ändert seinen Namen
        
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

                utilities.addToHistory(historyArray, obj, FILELOG, historysize);

                /** Objekt in JSON String konvertieren */
                json = JSON.stringify(obj);

                /** Sendet an ALLE verbundenen Clienten den JSON String */
                io.sockets.emit('servermessage', json);
                console.log(obj.zeit + ' ' + msg);
                

            } else {

                // Neuer User
                                
                client.username = data;
                usersonlineSet[data] = true; // Neuen Usernamen in Set speichern

                msg = client.username + ' joined the Chat.';
                
                obj = {
                    zeit: getTime(),
                    servermsg: msg
                };

                /** Objekt in Message Log einfügen */
                utilities.addToHistory(historyArray, obj, FILELOG, historysize);

                /** Objekt in JSON String konvertieren */
                json = JSON.stringify(obj);

                /** Sendet an ALLE verbundenen Clienten den JSON String */
                io.sockets.emit('servermessage', json);
                console.log(obj.zeit + ' ' + msg);

            }

        } catch(e) {

            console.log(getTime() + ' FEHLER BEIM SETZEN DES CLIENT USERNAMENS!'.red);
            console.log(getTime() + ' ' + e);

        }
        
    });


    /** Client sendet Nachricht an Server */
    client.on('message', function(data) {

        try {

            mid += 1; // MessageID inkrementieren

            /** Eingehende Message verarbeiten */
            data = utilities.cleanInput(data);

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
                utilities.addToHistory(historyArray, obj, FILELOG, historysize);

                /** Objekt in JSON String konvertieren */
                var json = JSON.stringify(obj);

                /** Sendet an ALLE verbundenen Clienten den JSON String */
                io.sockets.emit('message', json);

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
     * Sendet Array mit aktuellen Usern zurück, aber nur an den Client der angefragt hat
     * Wird nicht in History gespeichert.
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

            console.log(getTime() + ' CLIENT ABGEMELDET.'.green + utilities.getIP(client));
            
            var msg = client.username + ' left the chat.';
        
            obj = {
                zeit: getTime(),
                servermsg: msg
            };

            /** Objekt in Message Log einfügen */
            utilities.addToHistory(historyArray, obj, FILELOG, historysize);

            /** Objekt in JSON String konvertieren */
            json = JSON.stringify(obj);

            /** Sendet an ALLE verbundenen Clienten den JSON String */
            io.sockets.emit('servermessage', json);
            console.log( obj.zeit + ' ' + msg);

            delete usersonlineSet[client.username]; // Usernamen aus Useronline Set streichen
        
        } catch(e) {

            console.log(getTime() + ' FEHLER BEI CLIENT DISCONNECT'.red);
            console.log(getTime() + ' ' + e);

        }

    });


    ///////////////////////////////////
    // ZUKÜNFTIG MÖGLICHE FUNKTIONEN //
    ///////////////////////////////////

    /** Client für Moderation authentifizieren */
    client.on('auth', function(data) {
        client.auth = true;
    });

    /** MODERATION: Löscht einzelne Messages nach ID oder gesamte History aller Clients */
    client.on('clear', function(data) {});

    /**
     * MODERATION: Bannt Clienten vom Chatroom. Initiiert von Moderator Client
     * Eventuell dann sinnvoll uid an messages anzufügen
     * um alle Messages eines Users löschen zu können
    */
    client.on('ban', function(data) {});

    /** MODERATION: Chatroom schließen / öffnen */
    client.on('open', function(data) {});


});