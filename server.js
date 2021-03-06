var app = require('express')();

var http = require('http').Server(app);

var port = process.env.PORT || 3000;

var io = require('socket.io')(http);

const util = require('util');

var HashMap = require('hashmap');

const bodyParser = require('body-parser');

const boardUtils = require('./boardUtils');

app.use(bodyParser.json());

http.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

class GameClass {
  constructor(gameId, board, boardSettings) {
    this.gameId = gameId;
    this.board = board;
    this.boardSettings = boardSettings;
    this.sockets = [];
  }

  addSocket(socket) {
    this.sockets.push(socket);
  }
}

class GameSettings {
  constructor(flagsToWin, gentlemanRule) {
    this.flagsToWin = flagsToWin;
    this.gentlemanRule = gentlemanRule;
  }
}

const sockets = new HashMap();
var games = new HashMap();
const socktsIdsGame = new HashMap();

io.on('connection', (socket)=>{
  console.log(`Client ${socket.id} has connected`);
  sockets.set(socket.id, socket);

  socket.on('disconnect', ()=>{
    console.log(`Client ${socket.id} has disconnected`);
    const socketGameId = socktsIdsGame.get(socket.id);
    console.log(`socket disconnect gameId: ${socketGameId}`);

    if (typeof socketGameId !== 'undefined') {
      const game = games.get(socketGameId);
      const socket1 = game.sockets[0];
      const socket2 = game.sockets[1];

      if (socket1.id === socket.id) {
        socket2.emit('opponentLeft', {});
      } else {
        socket1.emit('opponentLeft', {});
      }

      games.remove(socketGameId);
      socktsIdsGame.remove(socket1.id);
      socktsIdsGame.remove(socket2.id);

    }
    sockets.remove(socket.id);
  });
});

async function createNewGame(req, res) {
  console.log(`createNewGame: start`);
  console.log(`createNewGame: headers: ${JSON.stringify(req.headers)}`);

  const socketId = req.header('socketId');
  const gameId = Math.random().toString(36).substring(2, 15).substring(0, 3);
  const gameSettings = req.body.gameSettings;
  const board = boardUtils.createBoard(20, 12, 50);
  //const board = req.body.board;

  while ( typeof games.get(gameId) !== 'undefined' ) {
    const gameId = Math.random().toString(36).substring(2, 15).substring(0, 6);
  }

  //console.log(util.inspect(gameSettings, false, null, true /* enable colors */));

  //console.log(`postNewGame: body: ${util.inspect(req.body)}`);

  //console.log(util.inspect(req.body, false, null, true /* enable colors */));

  games.set(gameId, new GameClass(gameId, board, new GameSettings(gameSettings.flagsToWin, gameSettings.gentlemanRule)));
  games.get(gameId).addSocket(sockets.get(socketId));

  console.log(`createNewGame: game: ${util.inspect(games.get(gameId))}`);
  //console.log(util.inspect(games.get(gameId), false, null, true /* enable colors */));

  res.status(200).send({"gameId" : gameId});
}

async function postMove(req, res) {
  const socketId = req.header('socketId');
  const gameId = req.header('gameId');
  const move = req.body

  console.log(`postMove:\ngameId: ${gameId}\nsocketId: ${socketId}\nmove: ${util.inspect(move)}`);

  const game = games.get(gameId);
  const socket1 = game.sockets[0];
  const socket2 = game.sockets[1];

  if (socket1.id === socketId) {
    socket2.emit("newMove", move);
  } else {
    socket1.emit("newMove", move);
  }

  res.status(200).send("Succ!!!");
}

async function enterGame(req, res) {
  const socketId = req.header('socketId');
  const gameId = req.body.gameId;

//console.log(util.inspect(req.body, false, null, true /* enable colors */));
  //console.log(util.inspect(req.header, false, null, true /* enable colors */));

  const game = games.get(gameId);

  console.log(`typeof game: ${typeof game}`);

  if (typeof game === 'undefined') {
    res.status(500).send({error: "game not found"});
  } else {
    game.addSocket(sockets.get(socketId));
    console.log(util.inspect(games.get(gameId), false, null, true /* enable colors */));

    const socket1 = game.sockets[0];
    const socket2 = game.sockets[1];


    const gameObject1 = {
      "gameId": game.gameId,
      "board": game.board,
      "gameSettings": game.boardSettings,
      "firstTurn": 0
    }

    const gameObject2 = {
      "gameId": game.gameId,
      "board": game.board,
      "gameSettings": game.boardSettings,
      "firstTurn": 1
    }

    //console.log(`enterGame: game first socket: ${util.inspect(game.sockets[0])}`);
    //console.log(`enterGame: game first socket: ${util.inspect(game.sockets[1])}`);

    socket1.emit('enterGame', gameObject1);
    socket2.emit('enterGame', gameObject2);

    socktsIdsGame.set(socket1.id, gameId);
    socktsIdsGame.set(socket2.id, gameId);

    res.status(200).send({"gameId" : gameId});
  }
}

app.post('/move', postMove);
app.post('/createNewGame', createNewGame);
app.post('/enterGame', enterGame);
