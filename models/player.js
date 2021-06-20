class Player {
  constructor(socket, user) {
    this.socket = socket;
    this.user = user;
    this.score = 0;
  }
}

module.exports = Player
