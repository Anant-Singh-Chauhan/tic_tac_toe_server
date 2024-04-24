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
      let rId = Math.ceil(Math.random()*1000000);

      randomPlayers.push({
        userId: socket.id,
        playerName: playerName,
        roomId: rId,
      });

      joinRoom({roomId : rId});
      

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

  // handle gameturns update
  socket.on("update-gameturns", (updatedGameTurns, gameRoomId)=>{
    socketServer.in(gameRoomId).emit("refresh-gameTurns", updatedGameTurns);
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

  // function to join player 2 to room of player 1
  function joinRoom({roomId}){
    socket.join(roomId, playerName => {
      console.log(`${playerName} joined room ${gameRoomId}`);
    });
  }

  // function to send starting game package
  function sendGameStartPackage({ players, gameRoomId }) {
    // default game package
    let gameStartPackage = {
      players,
      gameTurns: [],
      gameRoomId,
    };

    
    // console.log(`emitting to room id + ${gameRoomId}`)
    // console.log(socket.adapter.rooms.get(gameRoomId)?.size);
    // sends gameStartPackage to both players.
    socketServer.in(gameRoomId).emit("emit-game-start", gameStartPackage);
  }
});
