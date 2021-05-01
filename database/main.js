var admin = require("firebase-admin");

var firebaseCredential = require('./serviceCredentials.json');

admin.initializeApp({
  credential: admin.credential.cert(firebaseCredential),
  databaseURL: "https://minesweeper-online-3b776.firestoreio.com"
});

const firestore = admin.firestore();
const auth = admin.auth();


exports.admin = admin
exports.firestore = firestore
exports.auth = auth
