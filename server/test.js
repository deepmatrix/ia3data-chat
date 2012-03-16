// httphandler MUSS vor Aufruf definiert werden!

var httphandler = function(request, response) {

	// TODO
	console.log('Server antwortet');

	response.end();

};


var http = require('http').createServer(httphandler);
// var io = require('socket.io');


http.listen(8000);

console.log('Server läuft');

// io.listen(http);

