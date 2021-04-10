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
  constructor(gameId, board, boardSettings, isPrivate) {
    this.gameId = gameId;
    this.board = board;
    this.boardSettings = boardSettings;
    this.sockets = [];
    this.isPrivate = isPrivate;
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

// if the disconnected socket is in a game
    if (typeof socketGameId !== 'undefined') {
      const game = games.get(socketGameId);
      const gameSockets = game.sockets;

// remove the disconnected socket from the game's sockets and from the socketgames map
      if (gameSockets[0].id === socket.id) {
        socktsIdsGame.remove(gameSockets[0].id);
        gameSockets.splice(0, 1);
      } else {
        socktsIdsGame.remove(gameSockets[1].id);
        gameSockets.splice(1, 1);
      }

// if there is another socket in the game (running game), publish to it that the opponent left
      if (gameSockets.length !== 0) {
        socktsIdsGame.remove(gameSockets[0].id);
        gameSockets[0].emit('opponentLeft', {});
      }

// remove the game from the games map
      games.remove(socketGameId);
    }
    // remove the socket from the sockets map
    sockets.remove(socket.id);
  });
});

async function createNewPrivateGame(req, res) {
  console.log(`createNewPrivateGame: start`);
  console.log(`createNewPrivateGame: headers: ${JSON.stringify(req.headers)}`);

  const socketId = req.header('socketId');
  const gameId = Math.random().toString(36).substring(2, 15).substring(0, 3);
  const gameSettings = req.body.gameSettings;
  const isPrivate = req.body.isPrivate;
  const board = boardUtils.createBoard(20, 12, 50);
  //const board = req.body.board;

  while ( typeof games.get(gameId) !== 'undefined' ) {
    const gameId = Math.random().toString(36).substring(2, 15).substring(0, 6);
  }

  //console.log(util.inspect(gameSettings, false, null, true /* enable colors */));

  //console.log(`postNewGame: body: ${util.inspect(req.body)}`);

  //console.log(util.inspect(req.body, false, null, true /* enable colors */));

  games.set(gameId, new GameClass(gameId, board, new GameSettings(gameSettings.flagsToWin, gameSettings.gentlemanRule), isPrivate));
  games.get(gameId).addSocket(sockets.get(socketId));
  socktsIdsGame.set(socketId, gameId);

  console.log(`createNewGame: game: ${util.inspect(games.get(gameId))}`);
  //console.log(util.inspect(games.get(gameId), false, null, true /* enable colors */));

  res.status(200).send({"gameId" : gameId});
}

async function postMove(req, res) {
  console.log(`postMove: start`);

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

function enterGame(req, res) {
  console.log(`enterGame: start`);

  const socketId = req.header('socketId');
  const gameId = req.body.gameId;
  var game;

  // check if enter a private game or not private
  if (typeof gameId === 'undefined') {
    game = getValidGame();
  } else {
    game = games.get(gameId);
    if (typeof game === 'undefined') { // check if the user enter invalid game id
      return res.status(500).send({error: "game not found"});
    }
  }

  // if here, there is a valid game -- private or not
  console.log(`typeof game: ${typeof game}`);
  game.addSocket(sockets.get(socketId));
  socktsIdsGame.set(socketId, game.gameId);
  //console.log(util.inspect(game, false, null, true /* enable colors */));

  if (game.sockets.length === 2) { // if two player in the game, publish the sockets to start game
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
  }

  res.status(200).send({"gameId" : gameId});
}

function getValidGame() {
  // loop the games values,
  // if there is a not private game with 0/1 players, return it.
  // else, create a new game that not private, and return it.
  console.log(`getValidGame: start`);

  var validGame;

  games.values().forEach((game, i) => {
    if (!(game.isPrivate) && game.sockets.length < 2) {
      validGame = game;
    }
  });

  if (typeof validGame === 'undefined') {
    validGame = createNewNotPrivateGame();
  }

  return validGame;
}

function createNewNotPrivateGame() {
  console.log(`createNewNotPrivateGame: start`);

  var gameId = Math.random().toString(36).substring(2, 15).substring(0, 3);

  while ( typeof games.get(gameId) !== 'undefined' ) {
    gameId = Math.random().toString(36).substring(2, 15).substring(0, 6);
  }

  const board = boardUtils.createBoard(20, 12, 50);
  const game = new GameClass(gameId, board, new GameSettings(26, true), false);

  games.set(gameId, game);

  console.log(`createNewNotPrivateGame: game: ${util.inspect(game)}`);

  return game;
}

async function getGamesData(req, res) {
  var data = {

  };

  const values = games.values();
  console.log(values.length);
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

app.post('/move', postMove);
app.post('/createNewPrivateGame', createNewPrivateGame);
app.post('/enterGame', enterGame);
app.get('/gamesData', getGamesData);
