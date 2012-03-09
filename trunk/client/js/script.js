$(document).ready(function() {

                

                // Parameter
                var serverurl = 'http://localhost:8000';

                var clientname = 'Anon';

                var chatstatus;

                /** Lösche Message Box bei Browser-Aktualisierung */
                $('#nachrichtenEingabe').text('');

                /** Deaktiviere Eingabe bis Connection und Username gesetzt sind */
                $('button').attr('disabled', true);

                /** Objekt dass Serverconnection herstellt und verwaltet */
                var webSocket = io.connect(serverurl);

                /** Server Verbindung wird hergestellt */
                webSocket.on('connect', function() {

                    /** Lösche Message Box bei Browser-Aktualisierung */
                    $('#messages').text('');

                    chatstatus = 0;

                    

                });



                /** Server sendet Nachricht an Client */
                webSocket.on('message', function(data) {

                    //"data"-objekt in "obj" Variable parsen
                    var obj = jQuery.parseJSON(data);

                    //Objektattribute formatieren und in Variable speichern
                    var html = '<span class="message">';
                    html += '<span class="zeit">' + obj.zeit + '</span>'+" ";
                    html += '<span class="username" style="color: ' + obj.farbe + '">' + obj.username + '</span>' + ": ";
                    html += obj.msg;
                    html += '</span>' + '<br />';

                    //Variable ausgeben
                    $('#messages').append(html);

                });



                /** Server sendet Servermessage an Client */
                webSocket.on('servermessage', function(data) {

                    //"data"-objekt in "obj" Variable parsen
                    var obj = jQuery.parseJSON(data);
                    
                    //Objektattribute formatieren und in Variable speichern
                    var msg = '<li class="zeit" style="color:#00AA00">' + obj.zeit + " ";
                    msg += '<span class="servermsg">' + obj.servermsg + '</span>' + '</li>';

                    //Variable ausgeben
                    $('#messages').append(msg);

                });


                /** Server sendet History an Client */
                webSocket.on('history', function(data) {

                    //"data"-objekt in "obj" Variable parsen
                    var obj = jQuery.parseJSON(data);
                    
                    $.each(obj, function(index) {

                        //Objektattribute formatieren und in Variable speichern
                        var html = '<li class="zeit" style="color:#AAAAAA">' + obj[index].zeit + " ";

                        if (obj[index].servermsg) {

                            html += '<span class="servermsg">' + obj[index].servermsg +  '</span>'+ " ";

                        } else {
   
                            html += '<span class="username">' + obj[index].username + '</span>'+ ": ";
                            html += '<span class="message">' + obj[index].msg + '</span>' + '</li>';

                        }

                        

                        //Variable ausgeben
                        $('#messages').append(html);

                    });

                    //Text ausgeben
                    $('#messages').append('<li>Geben Sie Ihren Benutzernamen ein:</li>');

                });


                /** Server sendet Chatbenutzer an Client */
                webSocket.on('usersonline', function(data) {

                    // Info ausgeben
                    $('#messages').append('<li>Im Chat befinden sich derzeit:</li>');

                    //"data"-objekt in "obj" Variable parsen
                    var obj = jQuery.parseJSON(data);

                    //Objektattribute formatieren und in Variable speichern
                    var html = '<span class="usersonline">';

                        //Schleife zur Aneinanderreihung der User-Objekte
                        for (var o in obj) {

                            // Für jeden Datensatz eine Row
                            html += obj[o] + ', ';

                        }

                    html += '<br />' + '</span>';
                    
                    //Variable ausgeben
                    $('#messages').append(html);

                });



                /** Verbindung zum Server getrennt */
                webSocket.on('disconnect', function() {

                    //Text ausgeben
                    $('#messages').append('<li>Disconnected from the server.</li>');
                
                });



                //nach Klick auf Button: Benutzername ändern
                $('.userNameButton').bind('click', function() {

                    chatstatus = 0;

                    // Info ausgeben
                    $('#messages').append('<li>Geben Sie Ihren neuen Benutzernamen ein:</li>');
                    
                });



                //nach Klick auf Button: Angemeldete Benutzer ausgeben
                $('.userListButton').bind('click', function() {

                    // Nachricht versenden
                    webSocket.emit('usersonline', { my: 'data' });

                    chatstatus = 1;

                });

                /** Event-Handler: Enter Button */
                $('#nachrichtenEingabe').keypress (function(e) {

                    
                    // Enter abfragen
                    if(e.which == 13 || e.keyCode == 13) {

                        if(chatstatus == 0) {
                            
                            // Nachricht auslesen
                            var username = $('#nachrichtenEingabe').val();
                
                            // Textbox leeren
                            setTimeout(function() { // Fixt das doppelte Enter

                                $('#nachrichtenEingabe').val('');
                            
                            }, 3);
                
                            // Nachricht versenden
                            webSocket.emit('username', username);

                            chatstatus = 1;

                        }

                        else if(chatstatus == 1) {

                            // Nachricht auslesen
                            var message = $('#nachrichtenEingabe').val();
        
                            // Textbox leeren
                            setTimeout(function() { // Fixt das doppelte Enter

                                $('#nachrichtenEingabe').val('');
                        
                            }, 3);
        
                            // Nachricht versenden
                            webSocket.send(message);

                        }

                    }

                    else {
                        return;
                    }
       

                });

});
