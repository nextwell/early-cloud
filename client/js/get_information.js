$( "#button_download" ).click( function() {

	

	var connection_control = new WebSocket('ws://127.0.0.1:8070'); // connection

	

	connection_control.onopen = function () {
			var download_event = {
				  event: "get_information",
				  key: document.getElementById("unique_key_download").value
				};
				download_event = JSON.stringify(download_event); // send message
				connection_control.send(download_event);
		};
		connection_control.onmessage = function (e) {
			var message = JSON.parse(e.data);
			if (message['event'] == "download_sucess"){
				document.getElementById('name_of').innerHTML =  message['name']; // Name out
				document.getElementById('type_of').innerHTML = message['type']; // Type out
				document.getElementById('size_of').innerHTML = parseInt(message['size']/1024) + " КБ"; // Size out
				$( "#file_inf_download" ).append( "<a href='" + message['link'] + "' download><button id='download_file'>Скачать</button></a>" ); // added button to download
			}
		};


});