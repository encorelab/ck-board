import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Socket from "./socket/socket";
import posts from "./api/posts";
import likes from "./api/likes";
import comments from "./api/comments";
import boards from "./api/boards";
import buckets from "./api/buckets";
import projects from "./api/projects";
import workflows from "./api/workflows";
dotenv.config();

const port = process.env.PORT || 8001;
const dbUsername = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbURI = `mongodb+srv://${dbUsername}:${dbPassword}@ck-board-cluster.f2vut.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const app = express();
app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);

const socket = Socket.Instance;
socket.init();

app.use("/api/projects", projects);
app.use("/api/boards", boards);
app.use("/api/buckets", buckets);
app.use("/api/workflows", workflows);
app.use("/api/posts", posts);
app.use("/api/likes", likes);
app.use("/api/comments", comments);

mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(port);
    console.log("HTTP server running at " + port);
  })
  .catch((err) => console.log(err));
