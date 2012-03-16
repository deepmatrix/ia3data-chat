//////////////////////////////////
// FileServer Initialisierung ////
//////////////////////////////////

/**
 * Nimmt HTTP Anfragen entgegen und liefert den Client in HTML zurück
 * Socket.IO ist an den HTTP Server gebunden
 * Orientiert sich an einem Beispiel von http://socket.io/#how-to-use
 */
function httphandler(request, response, fs) {
 
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


exports.httphandler = httphandler;