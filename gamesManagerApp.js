const app = require('express')();
const bodyParser = require('body-parser');

const GameClass = require('./models/gameClass.js');
const GameSettings = require('./models/gameSettings.js');
const Player = require('./models/player.js');

const dataModule = require('./data.js');
const sockets = dataModule.sockets;
const games = dataModule.games;
const socketsIdsGame = dataModule.socketsIdsGame;
const socketsUsersMap = dataModule.socketsUsersMap;

const boardUtils = require('./boardUtils');
const util = require('util');


function createNewPrivateGame(req, res) {
  console.log(`createNewPrivateGame: start`);
  console.log(`createNewPrivateGame: headers: ${JSON.stringify(req.headers)}`);

  const socketId = req.header('socketId');
  const gameId = Math.random().toString(36).substring(2, 15).substring(0, 3);
  const gameSettings = req.body.gameSettings;
  const isPrivate = req.body.isPrivate;
  const board = boardUtils.createBoard(20, 12, 50);

  while ( typeof games.get(gameId) !== 'undefined' ) {
    const gameId = Math.random().toString(36).substring(2, 15).substring(0, 6);
  }

  games.set(gameId, new GameClass(gameId, board, new GameSettings(gameSettings.flagsToWin, gameSettings.gentlemanRule), isPrivate));
  const socket = sockets.get(socketId);
  const userId = socketsUsersMap.get(socketId);
  games.get(gameId).addPlayer(new Player(socket, userId)); // Moshiko addSocket(sockets.get(socketId));
  socketsIdsGame.set(socketId, gameId);

  console.log(`createNewGame: game: ${util.inspect(games.get(gameId))}`);
  //console.log(util.inspect(games.get(gameId), false, null, true /* enable colors */));

  res.status(200).send({"gameId" : gameId});
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
  const socket = sockets.get(socketId);
  const userId = socketsUsersMap.get(socketId);
  game.addPlayer(new Player(socket, userId)); // Moshiko addSocket(sockets.get(socketId));
  socketsIdsGame.set(socketId, game.gameId);
  //console.log(util.inspect(game, false, null, true /* enable colors */));

  if (game.players.length === 2) { // if two player in the game, publish the sockets to start game
    const socket1 = game.players[0].socket;
    const socket2 = game.players[1].socket;

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

    socket1.emit('enterGame', gameObject1);
    socket2.emit('enterGame', gameObject2);
  }

  res.status(200).send({"gameId" : gameId});
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

  return game;
}

function postMove(req, res) {
  console.log(`postMove: start`);

  const socketId = req.header('socketId');
  const gameId = req.header('gameId');
  const move = req.body

  console.log(`postMove:\ngameId: ${gameId}\nsocketId: ${socketId}\nmove: ${util.inspect(move)}`);

  const game = games.get(gameId);
  const socket1 = game.players[0].socket;
  const socket2 = game.players[1].socket;

  if (socket1.id === socketId) {
    socket2.emit("newMove", move);
  } else {
    socket1.emit("newMove", move);
  }

  res.status(200).send("Succ!!!");
}

function getValidGame() {
  // loop the games values,
  // if there is a not private game with 0/1 players, return it.
  // else, create a new game that not private, and return it.
  console.log(`getValidGame: start`);

  var validGame;

  games.values().forEach((game, i) => {
    if (!(game.isPrivate) && game.players.length < 2) {
      validGame = game;
    }
  });

  if (typeof validGame === 'undefined') {
    validGame = createNewNotPrivateGame();
  }

  return validGame;
}


app.post('/move', postMove);
app.post('/createNewPrivateGame', createNewPrivateGame);
app.post('/enterGame', enterGame);

module.exports = app
