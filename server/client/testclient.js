$(document).ready(function() {

    // Parameter
    var serverurl = 'http://localhost:8000';
    var clientname = 'Gast';

    /** Objekt dass Serverconnection herstellt und verwaltet */
    var webSocket = io.connect(serverurl);

    /** Lösche Message Box bei Browser-Aktualisierung */
    $('#messages').text('');

    /** Server Verbindung wird erstmalig hergestellt */
    webSocket.on('connect', function() {
        
        // Username setzen
        username = prompt("Dein Username?","");

        webSocket.emit('username', username);


    });

    /** Server sendet Nachricht an Client */
    webSocket.on('message', function(data) {

        $('#messages').append(data);

    });

    /** Server sendet Servermessage an Client */
    webSocket.on('servermessage', function(data) {

        var msg = '<li class="servermessage">' + data + '</li>';
        $('#messages').append(msg);

    });

    webSocket.on('history', function(data) {
        
        var html = '<div class="history">' + data + '</div>';
        $('#messages').append(html);

    });

    webSocket.on('usersonline', function(data) {

        console.log(data);
        var obj = jQuery.parseJSON(data);

        var html = '<span class="usersonline">';

        for (var o in obj) {

            // Für jeden Datensatz eine Row
            html += '<li>' + obj[o] + '</li>';

        }

        html += '</span>';
        
        $('#messages').append(html);

    });


    /** Verbindung zum Server getrennt */
    webSocket.on('disconnect', function(data) {

        $('#messages').append('<li>Disconnected from the server.</li>');

    });


    /** Event-Handler: Senden Button gedrückt. BESSER: Enter Button!*/
    $('#sendButton').bind('click', function() {

        // Nachricht auslesen
        var message = $('#messageText').val();

        if (message) {

            // Nachricht versenden
            webSocket.send(message);

            // Textbox leeren
            $('#messageText').val('');
        }

    });

    $('#usernameButton').bind('click', function() {

        // Nachricht auslesen
        var username = $('#messageText').val();

        if (username) {
            // Nachricht versenden
            webSocket.emit('username', username);

            // Textbox leeren
            $('#messageText').val('');
        }

        
    });

    $('#userButton').bind('click', function() {

        // Nachricht versenden
        webSocket.emit('usersonline', { my: 'data' });

    });

});