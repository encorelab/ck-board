import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Socket from './socket/socket';
import notifications from './api/notifications';
import posts from './api/posts';
import upvotes from './api/upvotes';
import comments from './api/comments';
import boards from './api/boards';
import buckets from './api/buckets';
import projects from './api/projects';
import workflows from './api/workflows';
import auth from './api/auth';
import trace from './api/trace';
import groups from './api/groups';
import todoItems from './api/todoItem';
import { isAuthenticated } from './utils/auth';
import redis from './utils/redis';
dotenv.config();

const port = process.env.PORT || 8001;
const ckAddr = process.env.CKBOARD_SERVER_ADDRESS || 'http://localhost:4201';
const scoreAddr = process.env.SCORE_SERVER_ADDRESS || 'http://localhost';
const dbUsername = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbUrl = process.env.DB_URL;
const dbName = process.env.DB_NAME;
const dbURI = `mongodb+srv://${dbUsername}:${dbPassword}@${dbUrl}.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const app = express();
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (origin != ckAddr && origin != scoreAddr) {
        const msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
        return callback(new Error(msg), false);
      }

      return callback(null, true);
    },
  })
);
app.use(bodyParser.json());
const server = http.createServer(app);

(async () => {
  await redis.connect();
  return redis;
})();

const socket = Socket.Instance;
socket.init();

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
app.use('/api/todoItems', isAuthenticated, todoItems);

mongoose
  .connect(dbURI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(port);
    console.log('HTTP server running at ' + port);
  })
  .catch((err) => console.log(err));
