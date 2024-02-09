const PORT = 3636;
const socketServer = require("socket.io")(PORT, {
  cors: {
    origin: "*",
  },
});

// empty array for storing users
let users = [];
let randomPlayers = [];

socketServer.on("connection", (socket) => {
  console.log(`socket connected, at socket id: ${socket.id}`);

  socket.on("add-remote-player", (playerName) => {
    users.push({
      userId: socket.id,
      playerName: playerName,
    });
    console.log(`users length:  ${users.length}`);

    users.forEach((user) => {
      console.log(`id : ${user["userId"]} player name : ${user["playerName"]}`);
    });
  });

  socket.on("add-random-player", (playerName) => {
    let playerNumber = randomPlayers.length;
    if (playerNumber % 2 == 0) {
      randomPlayers.push({
        userId: socket.id,
        playerName: playerName,
        roomId: socket.id,
      });
    } else {
      // found 2 players
      let firstPlayer = randomPlayers[playerNumber - 1];

      // game start logic

      // player names
      let Players = {
        "X" : firstPlayer["playerName"],
        "O" : playerName
      }

      // game room id
      let gameRoomId = firstPlayer["roomId"];

      // default gameTurns array
      let gameTurns = [];

      // TODO:
      // emit game start package to client here


      //
      randomPlayers.push({
        userId: socket.id,
        playerName: playerName,
        roomId: gameRoomId,
      });
    }

    console.log(`users length:  ${randomPlayers.length}`);

    randomPlayers.forEach((user) => {
      console.log(
        `id : ${user["userId"]} , player name : ${user["playerName"]} , roomId : ${user["roomId"]}`
      );
    });
  });
});
