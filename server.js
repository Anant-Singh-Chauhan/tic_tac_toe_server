const PORT = 3636;
const socketServer = require("socket.io")(PORT, {
  cors: {
    origin: "*",
  },
});

// empty array for storing users
let users = [];
let randomPlayers = [];

// on Socket connection
socketServer.on("connection", (socket) => {
  console.log(`socket connected, at socket id: ${socket.id}`);

  // handle "add-remote-player"
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

  // handle "add-random-player"
  socket.on("add-random-player", (playerName) => {
    let playerNumber = randomPlayers.length;

    // first player
    if (playerNumber % 2 == 0) {
      randomPlayers.push({
        userId: socket.id,
        playerName: playerName,
        roomId: socket.id,
      });

      // sendRoomId({ roomId: socket.id });
    } else {
      // found 2 players
      let firstPlayer = randomPlayers[playerNumber - 1];

      // game start logic

      // player names
      let Players = {
        X: firstPlayer["playerName"],
        O: playerName,
      };

      // game room id
      let gameRoomId = firstPlayer["roomId"];

      //
      randomPlayers.push({
        userId: socket.id,
        playerName: playerName,
        roomId: gameRoomId,
      });

      // join player2 to roomId of 1
      joinRoom({roomId : gameRoomId})

      // TODO:
      // emit game start package to client here
     

      // sendRoomId({ roomId: gameRoomId });
      sendGameStartPackage({players : Players, gameRoomId: gameRoomId})
    }

    console.log(`users length:  ${randomPlayers.length}`);

    randomPlayers.forEach((user) => {
      console.log(
        `id : ${user["userId"]} , player name : ${user["playerName"]} , roomId : ${user["roomId"]}`
      );
    });
  });

  // function to send player names
  function sendPlayerNames({ playersObj }) {
    socket.emit("emit-players-obj", playersObj);
  }

  // function to send room id
  function sendRoomId({ roomId }) {
    console.log(socket);
    socket.emit("emit-room-id", roomId);
  }

  // function to send gameTurns
  function sendGameTurns({ gameTurns }) {
    socket.emit("emit-gameTurns", gameTurns);
  }

  // function to join player 2 to room
  function joinRoom({roomId}){
    socket.join(roomId);
  }

  // function to send starting game package
  function sendGameStartPackage({ players, gameRoomId }) {
    // default game package
    let gameStartPackage = {
      players,
      gameTurns: [],
      gameRoomId,
    };

    // sends gameStartPackage to both players.
    socket.emit("emit-game-start", gameStartPackage);
  }
});
