class User {
  constructor(userId, userName, imageUrl, created, points, totalGames, totalWins, totalFlagsFor, totalFlagsAgainst) {
    this.userId = userId;
    this.userName = userName;
    this.imageUrl = imageUrl;
    this.created = created;
    this.points = points;
    this.totalGames = totalGames;
    this.totalWins = totalWins;
    this.totalFlagsFor = totalFlagsFor;
    this.totalFlagsAgainst = totalFlagsAgainst;
  }
}

module.exports = User
