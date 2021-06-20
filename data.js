var HashMap = require('hashmap');


const sockets = new HashMap(); // <socketId, Socket>
const games = new HashMap(); // <gameId, GameClass>
const socketsIdsGame = new HashMap(); // <socketId, gameId>
const usersMap = new HashMap(); // <userId, User>
const socketsUsersMap = new HashMap(); // <socketId, user>

module.exports = {
  sockets: sockets,
  games: games,
  socketsIdsGame: socketsIdsGame,
  usersMap: usersMap,
  socketsUsersMap: socketsUsersMap
}
