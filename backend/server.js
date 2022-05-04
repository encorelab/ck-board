const app = require("express")();
const http = require("http").createServer(app);
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const io = require("socket.io")(http, {
  cors: {
    origins: ["http://localhost:4200"],
  },
});

const port = process.env.PORT || 8000;

const dbUsername = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbURI = `mongodb+srv://${dbUsername}:${dbPassword}@ck-board-cluster.f2vut.mongodb.net/${dbName}?retryWrites=true&w=majority`;

io.on("connection", (socket) => {
  console.log("User connected!");

  let currentRoom;

  const safeJoin = (nextRoom) => {
    if (currentRoom) socket.leave(currentRoom);

    socket.join(nextRoom);
    currentRoom = nextRoom;
    console.log(`Socket ${socket.id} joined room ${nextRoom}`);
  };

  socket.on("join", (room) => safeJoin(room));

  /* User adds post to canvas and now added to DB */
  socket.on("handleAddPost", (post) => {
    /* Everyone connected is notified of post */
    socket.to(currentRoom).emit("notifyAddPost", post);
  });
});

mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Connected to MongoDB");
    http.listen(port);
    console.log("App running at " + port);
  })
  .catch((err) => console.log(err));
