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
    const socketGameId = socketsIdsGame.get(socket.id);
    console.log(`socket disconnect gameId: ${socketGameId}`);

// if the disconnected socket is in a game
    if (typeof socketGameId !== 'undefined') {
      const game = games.get(socketGameId);
      const gameSockets = game.sockets;

// remove the disconnected socket from the game's sockets and from the socketgames map
      if (gameSockets[0].id === socket.id) {
        socketsIdsGame.remove(gameSockets[0].id);
        gameSockets.splice(0, 1);
      } else {
        socketsIdsGame.remove(gameSockets[1].id);
        gameSockets.splice(1, 1);
      }

// if there is another socket in the game (running game), publish to it that the opponent left
      if (gameSockets.length !== 0) {
        socketsIdsGame.remove(gameSockets[0].id);
        gameSockets[0].emit('opponentLeft', {});
      }

// remove the game from the games map
      games.remove(socketGameId);
    }
    // remove the socket from the sockets map
    sockets.remove(socket.id);
  });
});

async function getGamesData(req, res) {
  var data = {

  };

  const values = games.values();
  var array = [];


  for (i = 0; i < values.length; i++) {
    const game = values[i];
    var item = {};
    var itemSockets = [];


    item["gameId"] = game.gameId;

    for (j = 0; j < game.sockets.length; j++) {
      itemSockets.push(game.sockets[j].id);
    }

    item["sockets"] = itemSockets;
    item["isPrivate"] = game.isPrivate;

    array.push(item);
  }

  data["games"] = array;

  res.send({"data": data});
}

app.use('/auth', authApp);
app.use(gamesManagerApp);
app.get('/gamesData', getGamesData);
