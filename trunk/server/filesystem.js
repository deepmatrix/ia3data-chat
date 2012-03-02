var http = require('http');
var fs = require('fs');
 
http.createServer(function (request, response) {
 
    console.log('request starting...');
     
    fs.readFile('./client/testclient.js', function(error, content) {
        if (error) {
            response.writeHead(500);
            response.end();
        }
        else {
            response.writeHead(200, { 'Content-Type': 'text/javascript' });
            response.end(content, 'utf-8');
        }
    });
     
}).listen(8001);
 
console.log('Server running at http://127.0.0.1:8001/');