var webSocket = require('socket.io').listen(8000);

webSocket.on('connection', function(client) {
    client.send('Please enter a user name ...');

    var userName;
    client.on('message', function(message) {

      console.log('Usermessage: ' + message);
        if(!userName) {
            userName = message;
            webSocket.broadcast(message + ' has entered the zone.');
            return;
        }



        var broadcastMessage = userName + ': ' + message;
        webSocket.broadcast(broadcastMessage);
    });

    client.on('disconnect', function() {
        var broadcastMessage = userName + ' has left the zone.';
        webSocket.broadcast(broadcastMessage);
    });
});