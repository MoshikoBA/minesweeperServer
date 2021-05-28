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

module.exports = GameClass
