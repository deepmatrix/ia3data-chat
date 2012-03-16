//////////////////////////////////
// Parameter und Variablen: //////
//////////////////////////////////

process.title = 'Node.js Chat Server'; // Prozess-Titel
exports.port = 8000; // Server Port
exports.historysize = 25; // Länge der History im Arbeitsspeicher (Array)
exports.gastname = 'Gast'; // Nur in Ausnahmefällen nötig
exports.DEBUG = false; // Schaltet DEBUG Modus an oder aus
exports.FILELOG = false; // Schaltet das Schreiben der Logdateien ins Dateisystem an oder aus

/**
 * Messagehistory Log
 * ACHTUNG: Logeinträge werden mit historyArray.add() hinzugefügt.
 * Das ist eine selbst definierte Hilfsfunktion (siehe unten)
 * @type {Array}
 */
exports.historyArray = [];

/**
 * Set mit den Namen aller User die online sind (Nur gefaktes Set)
 * @type {Object}
 */
exports.usersonlineSet = {};

/**
 * Array mit Farben die Usern zufällig zugewiesen werden
 * @type {Array}
 */
exports.farbArray = ['#F80E27', '#F7991D', '#8AD749', '#0D9FD8', '#8469D4']; // TODO: Mehr Farben

/**
 * UserID. Jeder User hat eine eindeutige ID.
 * Ist auch Gesamtanzahl der User insgesamt (Aber nicht aktuell online!)
 * So kann der Server potentiell die User verwalten (Bannen, etc.)
 */
exports.uid = 1;

/**
 * MessageID. Jede Usermessage hat eine eindeutige ID. Gesamtzahl der Messages.
 * So kann der Server potentiell auch die History der Clients beeinflussen.
 */
exports.mid = 1;