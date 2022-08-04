import express from "express";
import http from "http";
import bodyParser from "body-parser";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Socket from "./socket/socket";
import notifications from "./api/notifications";
import posts from "./api/posts";
import comments from "./api/comments";
import boards from "./api/boards";
import buckets from "./api/buckets";
import projects from "./api/projects";
import workflows from "./api/workflows";
import auth from "./api/auth";
import upvotes from './api/upvotes';
import trace from './api/trace';
import groups from './api/groups';
import { isAuthenticated } from './utils/auth';
dotenv.config();

const port = process.env.PORT || 8001;
const dbUsername = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbURI = `mongodb+srv://${dbUsername}:${dbPassword}@ck-board-cluster.f2vut.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const app = express();
app.use(
  cors({
    origin: "https://ck-board-staging.herokuapp.com/",
  })
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../../frontend/dist/ck-board")));

const server = http.createServer(app);

const socket = Socket.Instance;
socket.init(server);

app.use('/api/projects', isAuthenticated, projects);
app.use('/api/boards', isAuthenticated, boards);
app.use('/api/buckets', isAuthenticated, buckets);
app.use('/api/workflows', isAuthenticated, workflows);
app.use('/api/posts', isAuthenticated, posts);
app.use('/api/upvotes', isAuthenticated, upvotes);
app.use('/api/comments', isAuthenticated, comments);
app.use('/api/notifications', isAuthenticated, notifications);
app.use('/api/groups', isAuthenticated, groups);
app.use('/api/auth', auth);
app.use('/api/trace', isAuthenticated, trace);

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname + "/../../frontend/dist/ck-board/index.html")
  );
});

mongoose
  .connect(dbURI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(port);
    console.log('HTTP server running at ' + port);
  })
  .catch((err) => console.log(err));
