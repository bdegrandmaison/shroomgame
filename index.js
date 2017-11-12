var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var uuid = require('uuid/v1');
const MongoClient = require('mongodb').MongoClient;
const URL = 'mongodb://admin:admin@ds159845.mlab.com:59845/shroomgame';
var db;


app.use(express.static(__dirname + '/public'));

app.get('/classement/', function(req,res){
  db.collection('scores').find({}).sort({ score: -1 }).limit(10).toArray( (err, docs) => res.json(docs) );
});

app.get('/', function(req, res) {
  res.send('index.html');
});


let rooms = [];
let users = {};
let names = [];
let thisgame = {};
let temps = 60;

io.on('connection', function(client) {
  let opponent;
  client.id = uuid();
  let pointer = {
    style: {
      width: '10px',
      height: '10px',
      borderRadius: '5px',
      position: 'fixed',
      top: '',
      left: '',
      backgroundColor: 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',1)'
    }
  };

  client.on('pseudo', function(data) {
    if (!(names.includes(data))) {
      names.push(data);
      users[client.id] = {
        name: data
      };
      var table = [];
      if (rooms.length !== 0) {
        for (var i = 0; i < rooms.length; i++) {
          let thisroom = io.sockets.adapter.rooms[rooms[i]];
          if (thisroom) {
            table.push({
              name: rooms[i],
              number: thisroom.length
            });
          }
        }
        client.emit('verif', {
          reponse: "Good",
          rooms: table
        })
      } else {
        client.emit('verif', {
          reponse: "Good"
        })
      }
    } else {
      client.emit('verif', {
        reponse: "Bad"
      });
    }
  });

  client.on('salle', function(data) {
    if (!(rooms.includes(data))) {
      rooms.push(data);
      client.emit('verifroom', "Good");
      client.join(data);
      users[client.id].room = data;
      thisgame[data] = {};
      thisgame[data][users[client.id].name] = pointer;
    } else {
      client.emit('verifroom', "Bad");
    }
  });

  client.on('rejoindre', function(data) {
    client.join(data);
    users[client.id].room = data;
    thisgame[data][users[client.id].name] = pointer;
  });

  client.on('choixavatar', function(data) {
    users[client.id].avatar = data;
    let roomplayers = [users[client.id]];
    let tableau = Object.keys(io.sockets.adapter.rooms[rooms[0]].sockets);
    if (tableau.length === 2) {
      if (client.id === tableau[0]) {
        opponent = tableau[1];
        users[client.id].adversaire = users[opponent];
        roomplayers.push(users[opponent]);
      } else {
        opponent = tableau[0];
        users[client.id].adversaire = users[opponent];
        roomplayers.push(users[opponent]);
      }
      io.sockets.emit('miseenplace', roomplayers);
    }
  });

  client.on('gamestart', function(data) {
    if (thisgame[data.room]) {
      if (thisgame[data.room][data.name]) {
        thisgame[data.room][data.name].style.top = data.top;
        thisgame[data.room][data.name].style.left = data.left;
        io.sockets.emit('game', thisgame);
      }
    }
  });

  let current;

  var timestart = function(data) {
    current = setInterval(function() {
      if (thisgame[data].countdown > 0) {
        thisgame[data].countdown--;
        io.sockets.emit('timer', {
          room: data,
          countdown: thisgame[data].countdown
        });
      }
      if (thisgame[data].countdown === 0) {
        clearInterval(current);
        var lesjoueurs = Object.keys(thisgame[data]);
        if (thisgame[data][lesjoueurs[0]].score > thisgame[data][lesjoueurs[1]].score) {
          db.collection('scores').insertOne({
            user: lesjoueurs[0],
            score: thisgame[data][lesjoueurs[0]].score,
            temps: temps + ' s'
          }, function(err, docs) {
            console.log(err);
          });
        } else {
          if (thisgame[data][lesjoueurs[1]].score > thisgame[data][lesjoueurs[0]].score) {
            db.collection('scores').insertOne({
              user: lesjoueurs[1],
              score: thisgame[data][lesjoueurs[1]].score,
              temps: temps + ' s'
            }, function(err, docs) {
              console.log(err);
            });
          }
        }
        io.sockets.emit('gameover', {
          room: data,
          thisgame: thisgame[data]
        });
      };
    }, 1000);
  };

  client.on('ready', function(data) {
    if (thisgame[data]) {
      if (!thisgame[data].ready) {
        thisgame[data].ready = 1;
      } else {
        thisgame[data].ready++;
        if (thisgame[data].ready === 2) {
          if (!thisgame[data].countdown) {
            thisgame[data].countdown = temps;
            timestart(data);
          }
          io.sockets.emit('position', {
            room: data,
            top: (Math.random() * 91) + '%',
            left: (Math.random() * 91) + '%'
          });
        }
      }
    }
  });

  client.on('clicked', function(data) {
    if (thisgame[data.room]) {
      if (thisgame[data.room][data.player]) {
        if (!thisgame[data.room][data.player].score) {
          thisgame[data.room][data.player].score = 10;
          if (thisgame[data.room][data.adversaire]) {
            if (!thisgame[data.room][data.adversaire].score) {
              thisgame[data.room][data.adversaire].score = 0
            }
          }
        } else {
          thisgame[data.room][data.player].score += 10;
          if (thisgame[data.room][data.adversaire]) {
            if (!thisgame[data.room][data.adversaire].score) {
              thisgame[data.room][data.adversaire].score = 0
            }
          }
        }
      }
    }
    io.sockets.emit('position', {
      room: data.room,
      top: (Math.random() * 91) + '%',
      left: (Math.random() * 91) + '%',
      thisgame: thisgame[data.room]
    });
  });

  client.on('disconnect', function() {
    if (users[client.id] && users[client.id].room) {
      clearInterval(current);
      var lesjoueurs = Object.keys(thisgame[users[client.id].room]);
      if (thisgame[users[client.id].room][lesjoueurs[0]] === users[client.id].name) {
        db.collection('scores').insertOne({
          user: lesjoueurs[1],
          score: thisgame[users[client.id].room][lesjoueurs[1]].score,
          temps: (temps - thisgame[users[client.id].room].countdown) + ' s'
        }, function(err, docs) {
          console.log(err);
        });
        io.sockets.emit('youwin', {
          room: users[client.id].room,
          thisgame: thisgame[users[client.id].room]
        });
      } else {
        db.collection('scores').insertOne({
          user: lesjoueurs[0],
          score: thisgame[users[client.id].room][lesjoueurs[0]].score,
          temps: (temps - thisgame[users[client.id].room].countdown) + ' s'
        }, function(err, docs) {
          console.log(err);
        });
        io.sockets.emit('youwin', {
          room: users[client.id].room,
          thisgame: thisgame[users[client.id].room]
        });

      }
    }
    if (users[client.id]) {
      if (users[client.id].name) {
        let index = names.indexOf(users[client.id].name);
        names.splice(index, 1);
      }
      if (users[client.id].room && !io.sockets.adapter.rooms[users[client.id].room]) {
        let index2 = rooms.indexOf(users[client.id].room);
        rooms.splice(index2, 1);
      }
      delete users[client.id];
    }
  });

});

MongoClient.connect(URL, function(err, dbase) {
  if (err) {
    console.log('Erreur');
    return;
  }
  db = dbase;
  server.listen(8080);
});
