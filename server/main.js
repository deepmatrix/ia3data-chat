// Konstanten:
var port = 8000;


// Socket.IO Template (http://socket.io/#how-to-use)
var app = require('http').createServer(handler),
 io = require('socket.io').listen(app),
 fs = require('fs');

app.listen(port);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});