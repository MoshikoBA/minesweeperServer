class GameClass {
  constructor(gameId, board, boardSettings, isPrivate) {
    this.gameId = gameId;
    this.board = board;
    this.boardSettings = boardSettings;
    this.players = [];
    this.isPrivate = isPrivate;
  }

  addSocket(socket) {
    this.sockets.push(socket);
  }

  addPlayer(player) {
    this.players.push(player);
  }
}

module.exports = GameClass
