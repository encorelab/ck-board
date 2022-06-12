import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Socket from "./socket/socket";
import notifications from "./api/notifications";
import posts from "./api/posts";
import likes from "./api/likes";
import comments from "./api/comments";
import boards from "./api/boards";
import buckets from "./api/buckets";
import projects from "./api/projects";
import workflows from "./api/workflows";
import auth from "./api/auth";
import groups from "./api/groups";
import { isAuthenticated } from "./utils/auth";
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

app.use("/api/projects", isAuthenticated, projects);
app.use("/api/boards", isAuthenticated, boards);
app.use("/api/buckets", isAuthenticated, buckets);
app.use("/api/workflows", isAuthenticated, workflows);
app.use("/api/posts", isAuthenticated, posts);
app.use("/api/likes", isAuthenticated, likes);
app.use("/api/comments", isAuthenticated, comments);
app.use("/api/notifications", isAuthenticated, notifications);
app.use("/api/groups", isAuthenticated, groups);
app.use("/api/auth", auth);

mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(port);
    console.log("HTTP server running at " + port);
  })
  .catch((err) => console.log(err));
