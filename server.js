const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  var server = require('http').createServer();
  var io = require('socket.io').listen(server);
  
  var redis = require('socket.io-redis');

  io.adapter(redis({ host: 'localhost', port: 6379 }));
  
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
   cluster.on('death', function(worker) {
    console.log('Worker ' + worker.pid + ' died.');
    cluster.fork();
  });
}
else{

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const shortid= require('shortid');
//
  var userslist=[];
  var numofroom = 0;

var redis = require('socket.io-redis');

io.adapter(redis({ host: 'localhost', port: 6379 }));
//

var redis_server = require('redis');
var data_server = redis_server.createClient();

data_server.on('connect', function() {
    console.log('Connected to Redis...');
});

data_server.set('numofroom','0',function(err, reply){
});


'use strict';

const { networkInterfaces } = require('os');

const nets = networkInterfaces();
const results = Object.create(null); // or just '{}', an empty object

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }

            results[name].push(net.address);
        }
    }
}

console.log(results['Wi-Fi'][0]+` in process: ${process.pid}`);

app.set('view engine','pug');
app.set('views','./public/views');

app.get('/', function (req, res, next) {
    var id = shortid.generate();

    res.render("index",{ip:results['Wi-Fi'][0],numr:numofroom});

});

app.use(express.static('public'));

io.on('connection', function (client) {
    let id_client;
    console.log('Client connected...'+ client.id+` in process: ${process.pid}`);
    client.on('join', function (data) {
        console.log(data);
        id_client = data;

        data_server.sadd('userslist',data,function(err,reply){
            data_server.smembers('userslist',function(err,userslist){
                io.emit('disconnected',userslist);
            });
        });

        data_server.get('numofroom',function(err,reply){
            io.to(client.id).emit("numofroom",reply);
            console.log("Has ",reply," rooms");
        });
    });
    client.on('messages',function(data){
        io.emit('thread',data);
    });
    client.on("createroom",function(data){
        data_server.incr('numofroom');
        client.broadcast.emit("createdroom",1);
    });
    client.on("deleteroom",function(data){
        data_server.decr('numofroom');
        client.broadcast.emit("deletedroom",1);
    });
    client.on('joinroom',function(data){
        //console.log(client.adapter.rooms);
        let list_rooms;
        io.of('/').adapter.allRooms((err, rooms) => {
            list_rooms = rooms.indexOf(data);
            console.log(rooms," list_rooms ",list_rooms);// an array containing all rooms (accross every node)
            if(list_rooms>-1){
                io.in(data).clients((err, clients) => {
                    let num =  clients.length;
                    console.log(clients,num,"1 uesr in room"); // an array containing socket ids in 'room3'
                    if(num <2){
                        console.log("another player");
                    io.of('/').adapter.remoteJoin(client.id, data, (err) => {
                        if(err){    console.log(err);    }
                        io.to(client.id).emit("ssjoinroom",{room:data,icon:"O"});
                        io.to(data).emit("startgame","START GAME");
                    });
                    }else{
                        console.log("Room full");
                        io.to(client.id).emit("ffjoinroom","Room is full");
                    }
                });
            }else{
                console.log(list_rooms,"<===-1");
                io.of('/').adapter.remoteJoin(client.id, data, (err) => {
                    if(err){    console.log(err);    }
                    io.to(client.id).emit("ssjoinroom",{room:data,icon:"X"});
                    io.to(client.id).emit("waitgame","Wait for another player");
                });
            }

        });
    });
    client.on("leaveroom",function(data){
        io.of('/').adapter.remoteLeave(client.id, data.room, (err) => {
            if (err) { /* unknown id */ }
            io.in(data.room).clients((err, clients) => {
                    let num =  clients.length;
                    console.log(clients,num," uesr in room"); // an array containing socket ids in 'room3'
                    if(num == 1){
                        console.log("another player");
                        io.to(data.room).emit("ssjoinroom",{room:data.room,icon:"X"});
                        io.to(data.room).emit("waitgame","Enemy's out!!! Wait for another player");
                    }
            });
        });
    });
    client.on("leaveroom2",function(data){
        io.of('/').adapter.remoteLeave(client.id, data.room, (err) => {
            if (err) { /* unknown id */ }
        });
    });
    client.on("gocaro",function(data){
        client.to(data.room).emit("catchgocaro",{slot:data.slot,icon:data.icon});
    });
    client.on("result",function(data){
        client.to(data.room).emit("lose",data.result);
    });
    client.on('disconnect', function() {
      console.log('Got disconnect! '+id_client);
      io.of('/').adapter.remoteDisconnect(client.id, true, (err) => {
        if (err) { /* unknown id */ }
        // success
        });
        data_server.srem('userslist',id_client,function(err,reply){
            data_server.smembers('userslist',function(err,userslist){
                io.emit('disconnected',userslist);
            });
        });
    });
});
server.listen(2512);
}