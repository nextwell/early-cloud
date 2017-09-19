$( "#upload_file" ).click( function() {
	
	var currentFile = document.getElementById('files').files[0]; // get file data

	var connection_control = new WebSocket('ws://127.0.0.1:8070'); // connection

	if (currentFile.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document") 
		type_of_file = "Document";
	else type_of_file = currentFile.type;

	connection_control.onopen = function () {
			if ( currentFile != null ){
				var upload_event = {
				  "event": "upload",
				  "name": currentFile.name,
				  "type": type_of_file,
				  "size": currentFile.size
				};
				upload_event = JSON.stringify(upload_event); 
				connection_control.send(upload_event); // send
			}
		};
		connection_control.onmessage = function (e) {
			if (e.data == 'succesfully'){
				var connection_data = new WebSocket('ws://127.0.0.1:8080');
				connection_data.onopen = function(){
					connection_data.send(currentFile);
				}
				connection_data.onmessage = function(key){
					document.getElementById('unique_key').value = key.data;
				}
			}
		};
		/*connection.onclose = function(event) {
			connection.send("Client disconnected");
			$( "body" ).append( "<h3>Disconnected</h3>" );
		};*/


});

