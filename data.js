var HashMap = require('hashmap');


const sockets = new HashMap();
const games = new HashMap();
const socketsIdsGame = new HashMap();

module.exports = {
  sockets: sockets,
  games: games,
  socketsIdsGame: socketsIdsGame
}
