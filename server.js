// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';


server.listen(port, function () {
	console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/views'));


//
io.on('connection', function(socket){

	socket.mame = null;console.log("socket.mame: "+socket.mame);
	socket.oppoId = null;
	socket.highScore = null;
	socket.authorized = false;
	socket.readyReplay = false;
	//
	socket.on('authorizeS', function(data){
	});
	
	//
	socket.on('message', function(data){
		io.sockets.emit('message2', data);
		io.sockets.send(data)
	});
});
