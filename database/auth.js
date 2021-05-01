const authApp = require('express')();
const bodyParser = require('body-parser');
const util = require('util');

const firebase = require('./main.js');
const admin = firebase.admin;
const auth = firebase.auth;
const firestore = firebase.firestore;


authApp.use(bodyParser.json());


async function getUserData(req, res) {

  const userUID = req.body.userUID;

  const usersRef = firestore.collection('users');
  const user = await usersRef.doc(userUID).get();

  const userData = user.data();

  if (typeof userData !== 'undefined') {
    // the user is exists.
    return res.status(200).send({"user" : userData});
  } else {
    // this is a new user, create a doc with the user UID

    var guestCode = Math.random().toString(36).substring(2, 12).toLocaleUpperCase();

    const data = {
      userName: `GUEST_${guestCode}`,
      imageUrl: null,
      points: 0,
      totalGames: 0,
      totalWins: 0,
      created: new Date(),
      totalFlagsFor: 0,
      totalFlagsAgainst: 0,
    };

    await firestore.collection('users').doc(userUID).set(data);
    return res.status(200).send({"user" : data});

  }
}

authApp.get('/getUserData', getUserData);

module.exports = authApp;
