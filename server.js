import "dotenv/config";
import express, { json } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import router from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000", credentials: true },
});

// MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://projectyjka:53yjka21@asciicluster0.pgohfwc.mongodb.net/Hypo"
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

app.set("trust proxy", true);
app.use(json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use("/api/auth", router);

const rooms = {};

const questions = [
  { question: "What is 2 + 2?", options: ["3", "4", "5", "6"], answer: "4" },
  {
    question: "Which is the capital of France?",
    options: ["Berlin", "Madrid", "Paris", "Lisbon"],
    answer: "Paris",
  },
  {
    question: "What is the square root of 64?",
    options: ["6", "8", "10", "12"],
    answer: "8",
  },
];

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication failed!"));

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.user = decoded; // Attach user info to the socket
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    socket.emit("authError", { message: "Authentication error: Invalid or expired token." });
    next();
  }
});

io.on("connection", (socket) => {
  console.log(`🔥 User Connected: ${socket.id}`);

  socket.on("sendMessage", ({ roomID, sender, message }) => {
    if (!rooms[roomID]) return;
    if (!rooms[roomID].messages) rooms[roomID].messages = [];
    rooms[roomID].messages.push({ sender: sender, message: message });
    console.log(rooms[roomID].messages);
    io.to(roomID).emit("receiveMessage", {
      sender,
      message,
    });
  });

  socket.on("getMessages", ({ roomID }) => {
    if (!rooms[roomID]) return;
    const messages = rooms[roomID].messages;
    console.log(messages);
    socket.emit("messages", { messages });
  });

  socket.on("createRoom", ({ username }) => {
    console.log("createRoom me ghus gya. at line no. 71");
    if (!username) {
      console.log("Mai chala vapas!! from line no. 72");
      return;
    }
    console.log("Not returned from line no. 74");
    const roomID = Math.random().toString(36).substring(2, 8);
    rooms[roomID] = {
      users: [{ id: socket.id, username }],
      host: username,
      messages: [{ sender: socket.id, message: roomID }],
      questions,
      currentQuestion: 0,
      scores: { [username]: 0 },
    };

    socket.join(roomID);
    console.log("room joined");
    socket.emit("roomCreated", { roomID });
    console.log(`${username} created room ${roomID}`);
  });

  socket.on("joinRoom", ({ username, roomID }) => {
    if (!username || !roomID || !rooms[roomID])
      return socket.emit("error", "Invalid username or room not found");
    if (rooms[roomID].users.some((u) => u.username === username)) {
      const ind = rooms[roomID].users.findIndex(
        (user) => user.username === username
      );
      rooms[roomID].users[ind].id = socket.id;
    } else {
      rooms[roomID].users.push({ id: socket.id, username });
      rooms[roomID].scores[username] = 0;
    }
    console.log(rooms[roomID].users);
    // rooms[roomID].users.push({ id: socket.id, username });

    // rooms[roomID].scores[username] = 0;
    socket.join(roomID);
    const messg = `Swagatam ${username}`;
    socket.emit("roomJoined", { messg, roomID });
    io.to(roomID).emit("userJoined", {
      players: rooms[roomID].users.map((u) => u.username),
    });
    console.log(`${username} joined room ${roomID}`);
  });

  socket.on("leave", ({ roomID }) => {
    const index = rooms[roomID].users.findIndex(
      (user) => user.id === socket.id
    );
    rooms[roomID].users.splice(index, 1);
    if (rooms[roomID].users.size == 0) {
      const index = rooms.findIndex((room) => room.key === roomID);
      rooms.splice(index, 1);
    }
    socket.disconnect();
  });
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 6969;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));