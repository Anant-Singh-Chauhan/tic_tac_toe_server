const dotenv = require("dotenv");
const path = require("path");

// Load the appropriate .env file based on the environment
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(__dirname, envFile) });

const PORT = process.env.PORT;

const socketServer = require("socket.io")(PORT, {
  cors: {
    origin: "*",
  },
});

// empty array for storing users
let roomPlayers = [];
let randomPlayers = [];

// on Socket connection
socketServer.on("connection", (socket) => {
  // handle "add-room-player"
  socket.on("add-room-player", (playerName, roomId) => {
    // check if valid roomId exists
    if (roomId != "" && roomId != undefined) {
      if (!validateRoom(roomId)) return;
    } else {
      roomId = Math.ceil(Math.random() * 1000000).toString();
    }

    // adding players for room plays
    roomPlayers.push({
      userId: socket.id,
      playerName: playerName,
      roomId: roomId,
    });

    // join room
    joinRoom({ roomId: roomId });
    notifyRoomGame(roomId);

    console.log(`roomPlayers length:  ${roomPlayers.length}`);

    roomPlayers.forEach((user) => {
      console.log(
        `id : ${user["userId"]} , player name : ${user["playerName"]} , roomId : ${user["roomId"]}`
      );
    });

    let reqdRoomPlayers = roomPlayers.filter(
      (player) => player["roomId"] == roomId
    );
    if (reqdRoomPlayers.length == 2) {
      //

      // game start logics
      let Players = {
        X: reqdRoomPlayers[0].playerName,
        O: reqdRoomPlayers[1].playerName,
      };

      sendGameStartPackage({ players: Players, gameRoomId: roomId });
      notifyRoomGame(roomId);
    }
  });


  // handle "add-random-player"
  socket.on("add-random-player", (playerName) => {
    let playerNumber = randomPlayers.length;

    // first player
    if (playerNumber % 2 == 0) {
      let rId = Math.ceil(Math.random() * 1000000);

      randomPlayers.push({
        userId: socket.id,
        playerName: playerName,
        roomId: rId,
      });

      joinRoom({ roomId: rId });
    } else {
      // found 2 players
      let firstPlayer = randomPlayers[playerNumber - 1];

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
      joinRoom({ roomId: gameRoomId });

      sendGameStartPackage({ players: Players, gameRoomId: gameRoomId });
    }

    console.log(`remotePlayers length:  ${randomPlayers.length}`);

    // randomPlayers.forEach((user) => {
    //   console.log(
    //     `id : ${user["userId"]} , player name : ${user["playerName"]} , roomId : ${user["roomId"]}`
    //   );
    // });
  });

  // handle gameturns update
  socket.on("update-gameturns", (updatedGameTurns, gameRoomId) => {
    socketServer.in(gameRoomId).emit("refresh-gameTurns", updatedGameTurns);
  });

  // handle player disconnect
  socket.on("disconnect", () => {
    let disconnectedPlayer = randomPlayers.find(
      (randomPlayer) => randomPlayer["userId"] === socket.id
    );

    // search roomPlayers if not found in remotePlayers
    if (disconnectedPlayer == undefined) {
      disconnectedPlayer = roomPlayers.find(
        (roomPlayer) => roomPlayer["userId"] === socket.id
      );
    }

    disconnectedPlayer != undefined && handleDisconnection(disconnectedPlayer);
  });

  // handle player rematch request
  socket.on("rematch-requested-to-server", () => {
    let rematchPlayer = randomPlayers.find(
      (randomPlayer) => randomPlayer["userId"] === socket.id
    );

    if (rematchPlayer == undefined) {
      rematchPlayer = roomPlayers.find(
        (roomPlayer) => roomPlayer["userId"] === socket.id
      );
    }

    rematchPlayer != undefined &&
      socketServer
        .in(rematchPlayer["roomId"])
        .emit("rematch-requested-to-client", rematchPlayer);
  });

  // handle game chat
  socket.on("send-game-chat", (playerName, message, gameRoomId) => {
    socketServer
      .in(gameRoomId)
      .emit("game-chat-update", { playerName, message });
  });

  // function to check if room ID exists
  // in room players and has space
  function validateRoom(roomId) {
    let count = roomPlayers.filter(
      (player) => player["roomId"] == roomId
    ).length;

    if (count == 0) {
      socket.emit("invalid-room");
      return false;
    } else if (count >= 2) {
      socket.emit("room-full");
      return false;
    } else return true;
  }

  // function to notify about ROOM game
  function notifyRoomGame(roomId) {
    socketServer.in(roomId).emit("room-game", roomId);
  }

  // function to join player 2 to room of player 1
  function joinRoom({ roomId }) {
    socket.join(roomId, (playerName) => {
      console.log(`${playerName} joined room ${gameRoomId}`);
    });
  }

  // function to handle disconnection
  function handleDisconnection(disconnectedPlayer) {
    randomPlayers = randomPlayers.filter(
      (player) => player["userId"] != socket.id
    );

    roomPlayers = roomPlayers.filter((player) => player["userId"] != socket.id);

    socketServer
      .in(disconnectedPlayer["roomId"])
      .emit("player-disconnected", disconnectedPlayer);
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
    socketServer.in(gameRoomId).emit("emit-game-start", gameStartPackage);
  }
});
