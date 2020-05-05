const http = require("http");
const path = require("path");
const express = require("express");
const socketio = require("socket.io");
const bodyParse = require("body-parser");
const cors = require("cors");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketio(server);
port = process.env.PORT || 3000;

io.on("connection", (socket) => {
  console.log("conn logged");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit("message", {
      user: "Admin",
      text: `${user.username}, welcome to room ${user.room}.`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "Admin", text: `${user.username} has joined!` });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.username, text: message });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "Admin",
        text: `${user.username} has left.`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up ons port ${port}!`);
});
