class GameResponse {
  constructor(gameId, board, gameSettings, firstTurn, opponent) {
    this.gameId = gameId;
    this.board = board;
    this.gameSettings = gameSettings;
    this.firstTurn = firstTurn;
    this.opponent = opponent;
  }
}

module.exports = GameResponse
