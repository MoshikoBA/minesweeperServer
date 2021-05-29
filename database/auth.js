const authApp = require('express')();
const bodyParser = require('body-parser');
const util = require('util');

const User = require('../models/user.js');

const firebase = require('./main.js');
const admin = firebase.admin;
const auth = firebase.auth;
const firestore = firebase.firestore;

const dataModule = require('../data.js');
const sockets = dataModule.sockets;
const games = dataModule.games;
const socketsIdsGame = dataModule.socketsIdsGame;
const usersMap = dataModule.usersMap;
const socketsUsersMap = dataModule.socketsUsersMap;


authApp.use(bodyParser.json());


async function getUserData(req, res) {
  console.log("getUserData started");
  const userUID = req.body.userUID;
  const socketId = req.header('socketId');
  const usersRef = firestore.collection('users');
  const user = await usersRef.doc(userUID).get();

  var userData = await user.data();

  console.log(`type of user: ${typeof userData}`);

  if (typeof userData !== 'undefined') {
    // the user is exists.
    userData.created = userData.created.toDate();
    res.status(200).send({"user" : userData});
  } else {
    // this is a new user, create a doc with the user UID
    console.log("user no exists");

    var userId = Math.random().toString(36).substring(2, 12).toLocaleUpperCase();

    userData = {
      userId: userId,
      userName: `GUEST_${userId}`,
      imageUrl: null,
      created: new Date(),
      points: 0,
      totalGames: 0,
      totalWins: 0,
      totalFlagsFor: 0,
      totalFlagsAgainst: 0,
    };

    await firestore.collection('users').doc(userUID).set(userData);
    res.status(200).send({"user" : userData});
  }

  const finalUser = new User(
    userData.userId,
    userData.userName,
    userData.imageUrl,
    userData.created,
    userData.points,
    userData.totalGames,
    userData.totalWins,
    userData.totalFlagsFor,
    userData.totalFlagsAgainst);

    usersMap.set(finalUser.userId, finalUser);
    socketsUsersMap.set(socketId, finalUser.userId);
    return;
}

authApp.post('/getUserData', getUserData);

module.exports = authApp;
