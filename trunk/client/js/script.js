$(document).ready(function() {

                

                // Parameter
                var serverurl = 'http://localhost:8000';
                var clientname = 'Anon';

                /** Lösche Message Box bei Browser-Aktualisierung */
                $('#messages').text('');

                /** Deaktiviere Eingabe bis Connection und Username gesetzt sind */
                $('button').attr('disabled', true);

                /** Objekt dass Serverconnection herstellt und verwaltet */
                var webSocket = io.connect(serverurl);

                /** Server Verbindung wird hergestellt */
                webSocket.on('connect', function() {
                    
                    $('#messages').append('<li>Geben Sie Ihren Benutzernamen ein:</li>');

                    $('#nachrichtenEingabe').keypress (function(e) {

                    
                    // Enter abfragen
                    if(e.which == 13 || e.keyCode == 13) {
                        
                        // Nachricht auslesen
                        var username = $('#nachrichtenEingabe').val();
        
                        // Textbox leeren
                        setTimeout(function() { // Fixt das doppelte Enter
                            $('#nachrichtenEingabe').val('');
                        }, 3);
        
                        // Nachricht versenden
                        webSocket.emit('username', username);

                    // Schalte Input und Buttons frei
                    //$('button').attr('disabled', false);

                    }

                });

                });

                // $('#messages').lionbars();
                // TODO: Lionbars kommt mit interaktivem Inhalt nicht klar!

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

                    msg += '<span class="servermsg">' + obj.servermsg + '</span>' + '</li>';

                    $('#messages').append(msg);

                });

                webSocket.on('history', function(data) {

                    var obj = jQuery.parseJSON(data);

                    // TODO: Richtig formatieren, je nach "Typ" andere Aktion durchführen
                    // Wird dann JSON Datei sein!

                    /*var html = '<span class="zeit" style="color:#AAAAAA">' + obj.zeit + " ";

                    html += '<span class="servermsg">' + obj.servermsg + '</span>' + '</span>';*/
                    */
                    
                    $.each(obj, function(index) { 
                        //alert(obj[index].zeit+obj[index].servermsg);
                        var html = '<li class="zeit" style="color:#AAAAAA">' + obj[index].zeit + " ";

<<<<<<< .mine
                        html += '<span class="servermsg">' + obj[index].servermsg + '</span>' + '</li>';

                        $('#messages').append(html);
                        });
=======
                    $.each(obj, function(key, value) {alert( "The key is '" + key + "' and the value is '" + value + "'" );
                    });
                    // TODO
                    //$('#messages').append(data);

                });
                

                /*webSocket.on('history', function(data) {

                    var obj = jQuery.parseJSON(data);
                
                    var msg = '<li class="zeit">' + data + '</li>';
>>>>>>> .r97
                    
                    $('#messages').append(msg);

                });
                */

                webSocket.on('usersonline', function(data) {

                    //TODO: Anzahl der Chatuser vor auflistung
                    // Info ausgeben
                    $('#messages').append('<li>Im Chat befinden sich derzeit:</li>');

                    var obj = jQuery.parseJSON(data);

                    var html = '<span class="usersonline">';

                    for (var o in obj) {

                        // Für jeden Datensatz eine Row
                        html += obj[o] + ', ';

                    }

                    html += '</span>';
                
                    $('#messages').append(html);

                    /*
                    // TODO
                    var msg = '<span class="usersonline">' + data + '</span>';
                    $('#messages').append(msg);
                    */

                });


                /** Verbindung zum Server getrennt */
                webSocket.on('disconnect', function() {
                    $('#messages').append('<li>Disconnected from the server.</li>');
                });


                /** Event-Handler: Enter Button */
                $('#nachrichtenEingabe').keypress (function(e) {

                    
                    // Enter abfragen
                    if(e.which == 13 || e.keyCode == 13) {
                        
                        // Nachricht auslesen
                        var message = $('#nachrichtenEingabe').val();
        
                        // Textbox leeren
                        setTimeout(function() { // Fixt das doppelte Enter
                            $('#nachrichtenEingabe').val('');
                        }, 3);
        
                        // Nachricht versenden
                        webSocket.send(message);
                    
                    }

                });


                $('.userNameButton').bind('click', function() {

                    // Info ausgeben
                    $('#messages').append('<li>Geben Sie Ihren neuen Benutzernamen ein:</li>');

                    $('#nachrichtenEingabe').keypress (function(e) {

                    
                    // Enter abfragen
                    if(e.which == 13 || e.keyCode == 13) {
                        
                        // Nachricht auslesen
                        var username = $('#nachrichtenEingabe').val();
        
                        // Textbox leeren
                        setTimeout(function() { // Fixt das doppelte Enter
                            $('#nachrichtenEingabe').val('');
                        }, 3);
        
                        // Nachricht versenden
                        webSocket.emit('username', username);
                    
                    }

                });

                    /*
                    // Nachricht auslesen
                    var username = $('#messageText').val();

                    if (username) {

                        // Nachricht versenden
                        webSocket.emit('username', username);
            
                        // Textbox leeren
                        $('#messageText').val('');

                    }
                    */

                    
                });



                $('.userListButton').bind('click', function() {

                    // Nachricht versenden
                    webSocket.emit('usersonline', { my: 'data' });

                });

});
