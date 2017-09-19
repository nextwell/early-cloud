//----------------------------------------------------------------------------------------
// Cloud
//----------------------------------------------------------------------------------------


var fs = require('fs'); // Module for filesystem.
var path = require('path'); // Module for request path.
var chalk = require('chalk'); // Module for color console.
var mkdirp = require('mkdirp'); // Module for making directories.


//----------------------------------------------------------------------------------------
// Option config

var fileContents = fs.readFileSync('config.json','utf8');
var config = JSON.parse(fileContents);

//----------------------------------------------------------------------------------------
// Data Base

var file = "data.db";
var exists = fs.existsSync(file);

if(!exists) {
  console.log("Creating DB file.");
  fs.openSync(file, "w");
}

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file); // Module for db sqlite3

//----------------------------------------------------------------------------------------
// http Control Server

var httpServer_control = require('http').createServer(
    function(request, response) {}
).listen(config['CONTROL_PORT']);

//----------------------------------------------------------------------------------------
// http Data Server

var httpServer_data = require('http').createServer(
    function(request, response) {
        if(request.url != ''){//request.url is the file being requested by the client
            var filePath = '.' + request.url;
            if (filePath == './'){filePath = './ws_client.html';} // Serve index.html if ./ was requested
            var filename = path.basename(filePath);
            var extname = path.extname(filePath);
            var contentType = 'text/html';
            fs.readFile(filePath, function(error, content) {
				if (error){
					if (error.code == "ENOENT"){
						Log(chalk.red("Error with path. Download ERROR"), 'SERVER_CONTROL');
					}
					console.log(error);
				}
				else{
					response.writeHead(200, { 'Content-Type': contentType });
					response.end(content, 'utf-8');
					Log("Download succesfully done", 'SERVER_CONTROL');
				}
            });
        }
    }
).listen(config['DATA_PORT']);

//----------------------------------------------------------------------------------------
// Log

function Log(message, server){
    var date = new Date();
    var time = date.getDate()+'.'+date.getMonth()+'.'+date.getFullYear()+' '
               + date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();  
    console.log(chalk.green("[" + time + " " + server + "] ") + message);
}
Log("Server is running on port 8080", 'SERVER_DATA');
Log("Server is running on port 8070", 'SERVER_CONTROL');

var file_name;

//----------------------------------------------------------------------------------------
// Random naming

function randWD(n){  // [ 2 ] random words and digits
	return Math.random().toString(36).slice(2, 2 + Math.max(1, Math.min(n, 25)) );
} 

//----------------------------------------------------------------------------------------
// WS

var WebSocketServer = require('ws').Server;
var key_of;

//----------------------------------------------------------------------------------------
// Data WS Server

var ws_data = new WebSocketServer({server:httpServer_data});
ws_data.on('connection', function(ws) {
	//ws.send("Connection succesfully");
    ws.on('message', function(message) {
		db.serialize(function() {
			if(!exists) {
				db.run("CREATE TABLE files (key TEXT,name TEXT, link TEXT, size NUMBER, type TEXT)");
			}
			var stmt = db.prepare("INSERT INTO files VALUES (?, ?, ?, ?, ?)");
			stmt.finalize();
			db.each("SELECT key, name, link, size, type FROM files WHERE key = ?", key_of, function(err, row) {
				if (!err)
					fs.writeFile(row.link, message, 'utf8');
					ws.send(row.key);
			});
		});
		
    });
});

//----------------------------------------------------------------------------------------
// Control WS Server

var ws_control = new WebSocketServer({server:httpServer_control});
ws_control.on('connection', function(ws) {
	//ws.send("Connection succesfully");
    ws.on('message', function(message) {
		message = JSON.parse(message);
		if (message['event'] == 'upload'){
			if(message['size'] <= config['MAX_FILE_SIZE']){

				var key = randWD(25);
				key_of = key;
				var temp_link = randWD(25);
				mkdirp(config['UPLOAD_DIR'] + temp_link, function(err) { 
					if ( err ){
						console.log("Dir already exist");
					}
				});
				Log("Upload succesfully done", 'SERVER_DATA');
				db.serialize(function() {
					if(!exists) {
						db.run("CREATE TABLE files (key TEXT,name TEXT, link TEXT, size NUMBER, type TEXT)");
					}
					var stmt = db.prepare("INSERT INTO files VALUES (?, ?, ?, ?, ?)"); 
					stmt.run(key, message['name'], config['UPLOAD_DIR'] + temp_link + "/" + message['name'], message['size'], message['type']);
					stmt.finalize();
				});


				ws.send("succesfully");
			}
			else {
				ws.send("error");
				Log("Error with size!", "SERVER_CONTROL");
			}
		}
		else if (message['event'] == 'get_information'){
			db.serialize(function() {
				if(!exists) {
					db.run("CREATE TABLE files (key TEXT,name TEXT, link TEXT, size NUMBER, type TEXT)");
				}
				var stmt = db.prepare("INSERT INTO files VALUES (?, ?, ?, ?, ?)");
				stmt.finalize();
				db.each("SELECT name, link, size, type FROM files WHERE key = ?", [message['key']], function(err, row) {
					if (!err)
						var download_event = {
						  event: "download_sucess",
						  name: row.name,
						  size: row.size,
						  type: row.type,
						  link: "http://127.0.0.1:8080/" + row.link
						};
						download_event = JSON.stringify(download_event);
						ws.send(download_event);
						console.log(row.link);
				});
			});
			//db.close();
		}
    });
});


//sqlite