/*******************************************/
/* Verarbeitet die eingegangen Nachrichten */
/*******************************************/

function processMsg(client, msg, usersonlineArray) {

	/** HTML String bauen */
	// Alternativ: JSON Datei zurückgeben. HTML wird dann vom Client "gebaut"
	var htmlstr = '';

	msg = msg.trim(); /** Whitespaces entfernen */
	msg = msg.replace(/<(?:.|\n)*?>/gm, ''); /** HTML Tags entfernen, sonst Sicherheitslücke! */

	/** Check ob ein Querystring enthalten ist! */
	if (msg.substring(0, 1) === "/") {
		// Spezieller Query String!
		console.log('Query String eingegangen!!!');

		if (msg.substring(0, 5) === "/name") {

			var alterClientname = client.username;
			client.username = msg.split(' ')[1]; // Erstes Wort nach Leerzeichen
			console.log('Client hat Name gesetzt: ' + client.username);
			htmlstr += '<li>' + alterClientname + ' changed name to ' + client.username + '.</li>';

		}



	} else {
		
		htmlstr += '<li>' + client.username + ': ' + msg + '</li>';

	}


	return htmlstr;

}

// Macht Funktion als Modulfunktion verfügbar.
exports.processMsg = processMsg;