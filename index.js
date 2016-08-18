// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
	console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));
//
io.on('connection', function(socket){

	socket.mame = null;console.log("socket.mame: "+socket.mame);
	socket.oppoId = null;
	socket.highScore = null;
	socket.authorized = false;
	socket.readyReplay = false;
	//
	socket.on('authorizeS', function(data){
		//console.log("platform: "+data.platform);
		//console.log("version: "+data.version);
		var dialogs = null;
		if(data.version == '1.0' && data.socketID == 'ReversiBattleTVT'){
			socket.authorized = true;
		} else if(data.version == '1.01'){
			socket.authorized = true;
			var dialogs = {"mss":"Bạn nên cập nhật ứng dụng!","buttons":2,"button1":"Update","button1type":2,"button1link":"market://details?id=com.ginhd.NaughtyDog","button2":"Cancel"};
		} else if(data.version == '1.02'){
			var dialogs = {"mss":"Server đang bảo trì, xin quý vị vui lòng quay lại sau!","buttons":1,"button1":"Ok"};
		} else if(data.version == '1.03'){
			var dialogs = {"mss":"Bạn phải cập nhật ứng dụng!","buttons":2,"button1":"Update","button1type":2,"button1link":"market://details?id=com.ginhd.NaughtyDog","button2":"Cancel"};
		} else if(data.version == '1.04'){
		}
		if(socket.authorized){
			socket.emit('authorizedC', dialogs);
		} else{
			socket.emit('notauthorizedC', dialogs);
		}
	});
	
	//
	socket.on('message', function(data){
		io.sockets.emit('message2', data);
		io.sockets.send(data)
	});
	
	//
	socket.on('inWaitingRoomS', function(){
		if(socket.oppoId){//giveUp
			io.sockets.connected[socket.oppoId].emit('opponentGiveUpC');
			io.sockets.adapter.nsp.connected[socket.oppoId].oppoId = null;
		}
		socket.oppoId = null;
		socket.leave(socket.room);
		socket.room = 'WaitingRoom';
		socket.join('WaitingRoom');// send client to WaitingRoom
		socket.emit('inWaitingRoomC');//console.log("inWaitingRoomC");
		//socket.readytoplay = false;
		//
		//var clients = io.sockets.adapter.rooms['WaitingRoom']; // all users from WaitingRoom
		//console.log('all users from WaitingRoom: '+Object.keys(clients).length);
	});
  	//
  	socket.on('sendReadyToPlayS', function(data){//console.log("a");
		if(!socket.authorized)return;
		socket.readyReplay = false;
		socket.mame = data.name;//console.log('name: '+data.name);
		socket.highScore = data.highScore;
		var getopponent = false;
		//
		var clients = io.sockets.adapter.rooms['ReadyToPlayRoom'];
		//console.log('all users from ReadyToPlayRoom truoc: '+Object.keys(clients).length);
		if(clients){
			for(var id in clients){
				if(socket.id != id){
					socket.leave(socket.room);
					socket.room = 'Room'+socket.id;
					socket.join('Room'+socket.id);
					socket.oppoId = id;//console.log(socket.id+" tim thay doi thu "+id);
					//
					var opponent = io.sockets.adapter.nsp.connected[id];
					opponent.leave(opponent.room);
					opponent.room = 'Room'+socket.id;
					opponent.join('Room'+socket.id);
					opponent.oppoId = socket.id;
					//
    				socket.emit('getOpponentReadyToPlayC', {"name":opponent.mame,"highScore":opponent.highScore});
					io.sockets.connected[id].emit('player1InvitedOpponentC', {"name":socket.mame, "highScore":socket.highScore});
					//
					getopponent = true;
					break;
					//var clients2 = io.sockets.adapter.rooms['Room'+socket.id];
					//console.log('all users from '+'Room'+socket.id+':'+Object.keys(clients2).length);
				}
			}
		}//console.log("b");
		//
		if(!getopponent){
			socket.leave(socket.room);
			socket.room = 'ReadyToPlayRoom';
			socket.join('ReadyToPlayRoom');
			//console.log(socket.mame+': chua tim thay doi thu');
		}
		//console.log('all users from ReadyToPlayRoom sau: '+Object.keys(clients).length);
  	});
  	//
  	socket.on('player2GoToGameS', function(){
		if(!socket.oppoId)return;
		io.sockets.connected[socket.oppoId].emit('player2GoToGameC');
		//
		//var clients = io.sockets.adapter.rooms['Room'+id];
		//console.log('all users from Game room: '+Object.keys(clients).length);
  	});
  	//************************************************************
  	socket.on('player1ReadyReplayS', function(){
		if(!socket.oppoId)return;
		if(io.sockets.adapter.nsp.connected[socket.oppoId].readyReplay == false){
			socket.readyReplay = true;
			io.sockets.connected[socket.oppoId].emit('player1ReadyReplayC');
		}
  	});
	//
	socket.on('playerCancelReplayS', function(){
		if(!socket.oppoId)return;
		io.sockets.adapter.nsp.connected[socket.oppoId].oppoId = null;
		io.sockets.connected[socket.oppoId].emit('playerCancelReplayC');
		socket.oppoId = null;
  	});
	//
  	socket.on('player2ReadyReplayS', function(){
		if(!socket.oppoId)return;
		io.sockets.connected[socket.oppoId].emit('player2ReadyReplayC');
  	});
	//**************************************************************
	socket.on('player1SendMapS', function(map){
		if(!socket.oppoId)return;
		socket.readyReplay = false;
		io.sockets.connected[socket.oppoId].emit('player1SendMapC', map);
	});
	//
	socket.on('sendPostNumHS', function(data){
		if(!socket.oppoId)return;
		io.sockets.connected[socket.oppoId].emit('sendPostNumHC', data);
	});
	//
	socket.on('timeUpS', function(){
		if(!socket.oppoId)return;
		io.sockets.connected[socket.oppoId].emit('player2TimeUpC');
	});
	//when the user disconnects.. perform this
	socket.on('disconnect', function(){//console.log('socket.room1: '+socket.room);
		if(socket.oppoId){//console.log('socket.oppoId:'+socket.oppoId);
			//io.sockets.connected[socket.oppoId].emit('opponentDisconnectC');
			io.sockets.adapter.nsp.connected[socket.oppoId].oppoId = null;
		}
		if(socket.room && socket.room != 'WaitingRoom' && socket.room != 'ReadyToPlayRoom'){//console.log('socket.room2: '+socket.room);
			io.sockets.to(socket.room).emit('opponentDisconnectC');
		}
	});
});
