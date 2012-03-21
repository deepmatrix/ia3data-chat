////////////////////////////////////////////////////
// Multiuser Chat via Node.js und Socket.io       //
// http://code.google.com/p/ia3data-chat/         //
////////////////////////////////////////////////////
// Ein Projekt von Emanuel Kössel & Simon Heimler //
// 2012 > FH Augsburg > IAM3 > ia3.Netz & Data    //
////////////////////////////////////////////////////


//////////////////////////////////
// Hilfsfunktionen ///////////////
//////////////////////////////////

// Eigenes Modul das selbstgeschriebene Hilfsfunktionen sammelt.

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
 * Hilfsfunktion um in den historyArray neue Logeinträge einzufügen.
 * Falls die History größer ist als in der Variable historysize angegeben kürze sie.
 * @param  {array} array History Array
 * @param  {JSON} json JSON Objekt
 * @param  {boolean} FILELOG Boolean ob Filelog geschrieben werden soll
 * @param  {number} historysize Maximale Größe der History im Arbeitsspeicher
 */
function addToHistory(array, json, FILELOG, historysize) {

    // Fügt Eintrag in der erstellte Logdatei (Filesystem) an.
    // Hier werden keine Einträge gelöscht -> Archiv!
    if (FILELOG) {
        try {

            logfile.write(JSON.stringify(json) + '\n');

        } catch(e) {

            console.log(getTime() + ' FEHLER BEIM SCHREIBEN DER LOGDATEI'.red);
            console.log(getTime() + ' ' + e);

        }
    }
    
    // Füge JSON in Array ein
    array.push(json);

    // Falls die History die Historysize übersteigt, lösche ältesten Eintrag
    if (this.length > historysize) {
        this.shift(); // Performance?
    }

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
 * Hilfsfunktion die die IP Adresse und den Port des Clients ermittelt und formatiert
 * @param  {object} client Der spezifische Client
 * @return {string}
 */
function getIP(client) {

    var address = '[' + client.handshake.address.address + ':' + client.handshake.address.port + ']';

    return address.yellow;

}

/* Zugriffe exportieren */
exports.getTime = getTime;
exports.addToHistory = addToHistory;
exports.shuffle = shuffle;
exports.cleanInput = cleanInput;
exports.getIP = getIP;