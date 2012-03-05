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

process.title = 'Node.js Chat'; // Prozess-Titel
var port = 8000; // Server Port
var historysize = 10; // Länge der History (Array) im Arbeitsspeicher
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
var farbArray = ['#F80E27', '#F7991D', '#8AD749', '#0D9FD8', '#8469D4']; // TODO: Mehr Farben
farbArray = shuffle(farbArray); // Zufallsreihenfolge

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

//////////////////////////////////
// HTTPserver Initialisierung ////
//////////////////////////////////

/**
 * Nimmt HTTP Anfragen entgegen und liefert den Client in HTML zurück
 * Socket.IO ist an den HTTP Server gebunden
 */
function httphandler(request, response) {
 
    console.log(getTime()  + ' LIEFERE CLIENT HTML.'.green);
    
    /** List die Client HTML ein und gibt sie bei jeder HTTP Anfrage aus */
    fs.readFile('./testclient.htm', function(error, content) {

        // TODO: Liefert nur testclient aus!
        
        if (error) {

            response.writeHead(500);
            response.end();

            console.log(getTime() + ' FEHLER BEIM SENDEN DES CLIENTS'.red);
            console.log(getTime() + error.toString());

        } else {

            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(content, 'utf-8');
        }
    });
     
}


//////////////////////////////////
// Chatserver Initialisierung ////
//////////////////////////////////

// Socket.io Konfiguration: https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO

/** Logging Level von Websockets reduzieren */
io.set('log level', 1);

/** Wahl und Reihenfolge der zu verwendenden Transport Protokolle */
io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
// Info: Opera verweigert den Dienst

/** Kompression etc. */
io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file

// TODO: Problem Same Origin Policy noch nicht gelöst! Chrome verweigert Dienst.
// Die Dateien auf einem Apache Server ausliefen und die URLs entsprechend anpassen löst das Problem!
io.set('origins', '*:*');


console.log(getTime()  + ' SERVER UP AND RUNNING.'.green);

/** Erstellt im Dateisystem eine Logdatei mit aktuellem Datestamp als Dateinamen */
try {

    var logfile = fs.createWriteStream("./log/" + new Date().getTime() + ".txt",
    {flags: "a", encoding: "utf-8"});

} catch(e) {

    console.log(getTime() + ' FEHLER BEIM ERSTELLEN DER LOGDATEI'.red);
    console.log(getTime() + ' ' + e + ''.red);

}


////////////////////////////////////////
// Server Transport Logik (Socket.io) //
////////////////////////////////////////

/** Client verbindet sich mit Server */
io.sockets.on('connection', function(client) {

    try {

        // console.dir(client); // Gibt alle Client Infos aus

        /** Client verbindet sich neu mit Server */
        console.log(getTime()  + ' NEUER CLIENT VERBUNDEN. '.green + getIP(client));
        uid += 1;
        client.uid = uid; // Client die uid intern zuweisen

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

            /** Stellt sicher dass User einen gültigen Usernamen hat falls der Client dabei fehlschlägt */
            if (!data || data.length < 1) {
                data = gastname + '-' + uid;
            }

            /** Ruft Hilfsfunktion auf, die die empfangenen Daten "säubert" */
            data = cleanInput(data);

            /** Stellt sicher dass die Usernamen eindeutig sind */
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
                historyArray.add(obj);

                /** Objekt in JSON String konvertieren */
                json = JSON.stringify(obj);

                /** Sendet an ALLE verbundenen Clienten den JSON String */
                io.sockets.emit('servermessage', json);
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
                io.sockets.emit('servermessage', json);
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
            data = cleanInput(data);

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

            console.log(getTime() + ' CLIENT ABGEMELDET.'.green + getIP(client));
            
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
            io.sockets.emit('servermessage', json);
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

    /** Sorgt dafür dass die Zahl immer zweistellig ist */
    function volle(zeit) {

        if (zeit > 9) {
            return zeit;
        } else {
            return "0" + zeit;
        }

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
 * @param  {object} client Der spezifische Client
 * @return {string}
 */
function getIP(client) {

    var address = '[' + client.handshake.address.address + ':' + client.handshake.address.port + ']';

    return address.yellow;

}