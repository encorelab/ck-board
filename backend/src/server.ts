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
import learner from './api/learner';
import { isAuthenticated } from './utils/auth';
import db from './database/db';

dotenv.config();

const port = process.env.PORT || 8001;

const app = express();
app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);

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
app.use('/api/learner', isAuthenticated, learner);

db.getConnection().once('open', () => {  
  console.log('Connected to MongoDB'); 
  server.listen(port);
  console.log('HTTP server running at ' + port);
});

db.getConnection().on('error', (err) => console.log(err));
