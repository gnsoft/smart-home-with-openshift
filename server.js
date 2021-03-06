//@GnSoft 2016 (mobileteamdeveloper@gmail.com)
//Setup express server
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
/*app.get('/home', function (req, res) {
  res.sendfile(__dirname + '/views/home.html');
});*/

//
var homeStatus = {};
//
io.on('connection', function(socket){

	socket.mame = null;
	//
	socket.on('homeRegister', function(data){
		console.log("homeRegister");
		socket.mame = "home";
		homeStatus = data;
		sendHomeStatusToDevice(true);
	});
	//
	socket.on('deviceRegister', function(data){
		console.log("deviceRegister");
		sendHomeStatusToDevice();
	});
	
	//
	socket.on('action-DeviceToServer', function(data){
		if(!homeStatus.homeRegistered)return;
		console.log("action-DeviceToServer: "+data.action+"="+data.value);
		if(data.action === "atHome"){
			if(homeStatus.hasOwnProperty(data.action))homeStatus[data.action] = data.value;
			return;
		}
		io.sockets.emit('action-ServerToHome', data);
	});
	//
	socket.on('action-HomeToServer', function(data){
		if(homeStatus.hasOwnProperty(data.action))homeStatus[data.action] = data.value;
		io.sockets.emit('action-ServerToDevice', data);
	});
	//
	socket.on('callback-HomeToServer', function(data){
		if(homeStatus.hasOwnProperty(data.action))homeStatus[data.action] = data.value;
		io.sockets.emit('callback-ServerToDevice', data);
	});
	//
	socket.on('disconnect', function(){
		if(socket.mame == "home"){
			homeStatus.homeRegistered = false;
			sendHomeStatusToDevice(true);
		}
	});
	//
	function sendHomeStatusToDevice(myHome){
		console.log("homeStatus-ServerToDevice, homeRegistered:"+homeStatus.homeRegistered);
		if(myHome){
			io.sockets.emit('homeStatus-ServerToDevice', homeStatus);
		} else{
			socket.emit('homeStatus-ServerToDevice', homeStatus);
		}
	}
});

