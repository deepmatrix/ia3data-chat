$(document).ready(function() {

                $('#chat').lionbars();

                // Parameter
                var serverurl = 'http://localhost:8000';
                var clientname = 'Anon';

                /** Objekt dass Serverconnection herstellt und verwaltet */
                var webSocket = io.connect(serverurl);

                /** Server Verbindung wird hergestellt */
                webSocket.on('connect', function() {
                    
                    // Username setzen
                    username = prompt("Dein Username?","");
                    webSocket.emit('username', username);

                });

                /** Server sendet Nachricht an Client */
                webSocket.on('message', function(data) {

                    var obj = jQuery.parseJSON(data);

                    var html = '<span class="message">';

                    html += '<span class="time">' + obj.time + '</span>';
                    html += '<span class="username" style="color: ' + obj.color + '">' + obj.username + '</span>';
                    html += obj.msg;

                    html += '</span>';

                    // TODO: Richtig formatieren, je nach "Typ" andere Aktion durchführen
                    // Wird dann JSON Datei sein!
                    $('#messages').append(html);

                });

                /** Server sendet Servermessage an Client */
                webSocket.on('servermessage', function(data) {

                    var obj = jQuery.parseJSON(data);

                    // TODO: Richtig formatieren, je nach "Typ" andere Aktion durchführen
                    // Wird dann JSON Datei sein!
                    
                    var msg = '<li class="servermessage">' + obj.msg + '</li>'
                    $('#messages').append(msg);

                });

                webSocket.on('history', function(data) {

                    // TODO
                    $('#messages').append(data);

                });

                webSocket.on('usersonline', function(data) {

                    // TODO
                    var msg = '<span class="usersonline">' + data + '</span>'
                    $('#messages').append(msg);

                });


                /** Verbindung zum Server getrennt */
                webSocket.on('disconnect', function() {
                    $('#messages').append('<li>Disconnected from the server.</li>');
                });


                /** Event-Handler: Enter Button */
                $('#chat').keypress (function() {

                    // TODO : Enter abfragen: IF

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
