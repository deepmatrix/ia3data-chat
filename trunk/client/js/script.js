$(document).ready(function() {

                $('messages').lionbars();

                // Parameter
                var serverurl = 'http://localhost:8000';
                var clientname = 'Anon';

                /** Objekt dass Serverconnection herstellt und verwaltet */
                var webSocket = io.connect(serverurl);

                /** Server Verbindung wird hergestellt */
                webSocket.on('connect', function() {
                    
                    $('#messages').append('<li>Geben Sie Ihren Benutzernamen ein:</li>');

                    // Username setzen
                    username = $('#nachrichtenEingabe').val();
                    webSocket.emit('username', username);

                });

                /** Server sendet Nachricht an Client */
                webSocket.on('message', function(data) {

                    var obj = jQuery.parseJSON(data);

                    var html = '<span class="message">';

                    html += '<span class="zeit">' + obj.zeit + '</span>'+" ";
                    html += '<span class="username" style="color: ' + obj.farbe + '">' + obj.username + '</span>' + ": ";
                    html += obj.msg;

                    html += '</span>' +'<br />';

                    // TODO: Richtig formatieren, je nach "Typ" andere Aktion durchführen
                    // Wird dann JSON Datei sein!
                    $('#messages').append(html);

                });

                /** Server sendet Servermessage an Client */
                webSocket.on('servermessage', function(data) {

                    var obj = jQuery.parseJSON(data);

                    // TODO: Richtig formatieren, je nach "Typ" andere Aktion durchführen
                    // Wird dann JSON Datei sein!
                    
                    var msg = '<li class="zeit" style="color:#00AA00">' + obj.zeit + " ";

                    msg += '<span class="servermsg">' + obj.servermsg + '</span>' + '</li>'

                    $('#messages').append(msg);

                });

                webSocket.on('history', function(data) {

                    var obj = jQuery.parseJSON(data);

                    // TODO: Richtig formatieren, je nach "Typ" andere Aktion durchführen
                    // Wird dann JSON Datei sein!

                    var msg = '<span class="zeit" style="color:#AAAAAA">' + obj.zeit + " ";

                    msg += '<span class="servermsg">' + obj.servermsg + '</span>' + '</span>'

                    // TODO
                    $('#messages').append(msg);

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
                $('#nachrichtenEingabe').keypress (function(e) {

                    
                    // Enter abfragen
                    if(e.keyCode == '13') {
                        
                        // Nachricht auslesen
                        var message = $('#nachrichtenEingabe').val();
        
                        // Nachricht versenden
                        webSocket.send(message);
            
                        // Textbox leeren
                        $('#nachrichtenEingabe').val("");
                    
                    }

                });


                $('.userNameButton').bind('click', function() {

                    // Info ausgeben
                    $('#messages').append('<li>Geben Sie Ihren neuen Benutzernamen ein:</li>');

                    // Nachricht auslesen
                    var username = $('#messageText').val();

                    if (username) {
                        // Nachricht versenden
                        webSocket.emit('username', username);
            
                        // Textbox leeren
                        $('#messageText').val('');

                    }

                    
                });



                $('.userListButton').bind('click', function() {

                    // Info ausgeben
                    $('#messages').append('<li>Im Chat befinden sich derzeit:</li>');

                    // Nachricht versenden
                    webSocket.emit('usersonline', { my: 'data' });

                });

});
