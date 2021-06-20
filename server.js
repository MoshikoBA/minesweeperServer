var app = require('express')();
var http = require('http').Server(app);
var port = process.env.PORT || 3000;
var io = require('socket.io')(http);

const bodyParser = require('body-parser');

const authApp = require('./database/auth.js');
const gamesManagerApp = require('./gamesManagerApp.js');

const dataModule = require('./data.js');
const sockets = dataModule.sockets;
const games = dataModule.games;
const socketsIdsGame = dataModule.socketsIdsGame;
const usersMap = dataModule.usersMap;
const socketsUsersMap = dataModule.socketsUsersMap;

app.use(bodyParser.json());

http.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});


io.on('connection', (socket)=>{
  console.log(`Client ${socket.id} has connected`);
  sockets.set(socket.id, socket);
  socket.emit("socketConnected", {});

  socket.on('disconnect', ()=>{
    console.log(`Client ${socket.id} has disconnected`);
    const gameId = socketsIdsGame.get(socket.id);
    console.log(`socket disconnect gameId: ${gameId}`);

    const socketId = socket.id;
    const userId = socketsUsersMap.get(socketId);

// if the disconnected socket is in a game
    if (typeof gameId !== 'undefined') {
      const game = games.get(gameId);
      const players = game.players;

      // remove the disconnected socket from the game's players and socketsIdsGame
      if (players[0].socket.id === socketId) {
        players.splice(0, 1);
      } else {
        players.splice(1, 1);
      }

      socketsIdsGame.remove(socketId);

      // if there is another socket in the game (running game), publish to it that the opponent left
      if (players.length !== 0) {
        socketsIdsGame.remove(players[0].socket.id);
        players[0].socket.emit('opponentLeft', {});
      }

      // remove the game from the games map
      games.remove(gameId);
    }
    // remove the socket from the sockets map, socketgames map, usersMap and socketsUsersMap
    usersMap.remove(userId);
    socketsUsersMap.remove(socketId);
    sockets.remove(socketId);
  });
});

async function getGamesData(req, res) {
  var data = {

  };

  const allGames = games.values();
  var array = [];


  for (i = 0; i < allGames.length; i++) {
    const game = allGames[i];
    var item = {};
    var itemSockets = [];

    const players = game.players;
    item["gameId"] = game.gameId;

    for (j = 0; j < players.length; j++) {
      itemSockets.push(players[j].socket.id);
    }

    item["sockets"] = itemSockets;
    item["isPrivate"] = game.isPrivate;

    array.push(item);
  }

  data["games"] = array;

  res.send({"data": data});
}

function getUSers(req, res) {
  res.send({"users": usersMap.values()});
}

app.use('/auth', authApp);
app.use(gamesManagerApp);
app.get('/gamesData', getGamesData);
app.get('/users', getUSers);
