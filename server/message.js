/*******************************************/
/* Verarbeitet die eingegangen Nachrichten */
/*******************************************/

function processMsg(msg) {

	/** Unnötige Whitespaces entfernen */
	msg.trim(); /** HTML Tags entfernen, sonst Sicherheitslücke! */
	msg.replace(/<(?:.|\n)*?>/gm, '');

	/** Check ob ein Querystring enthalten ist! */
	if (msg.substring(0, 1) == "/") {
		// Spezieller Query String!
		console.log('Query String eingegangen!!!');

		if (msg.substring(0, 5) == "/name") {
			clientname = msg.split(' ')[1];
			console.log('Client hat Name gesetzt: ' + clientname);
		}
	}

	/** HTML String bauen */
	var htmlstr = '<li>' + clientname + ': ' + msg + '</li>';

	return htmlstr;

}

// Macht Funktion als Modulfunktion verfügbar.
exports.processMsg = processMsg;