import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
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
import RedisClient from './utils/redis';
import aiRouter from './api/ai';
import chatHistoryRouter from './api/chatHistory'; 
import activitiesRouter from './api/activities';
import resourcesRouter from './api/resources';
import teacherTaskRouter from './api/teacherTasks'
import aiAgentRoutes from './api/aiAgents';
import groupTasks from './api/groupTasks';

dotenv.config();

const port = process.env.PORT || 8001;
const dbURI = `${process.env.MONGO_URI}`;

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = (process.env.REDIS_PORT || 6379) as number;
const redisPassword = process.env.REDIS_PASSWORD || '';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const staticFilesPath = path.join(__dirname, '../../frontend/dist/ck-board');
app.use(express.static(staticFilesPath));

const server = http.createServer(app);

RedisClient.init({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  tls: {
    minVersion: 'TLSv1.3',
  },
});

const socket = Socket.Instance;

socket.init(server, RedisClient);

app.use('/api/projects', isAuthenticated, projects);
app.use('/api/boards', isAuthenticated, boards);
app.use('/api/buckets', isAuthenticated, buckets);
app.use('/api/workflows', isAuthenticated, workflows);
app.use('/api/groupTasks', isAuthenticated, groupTasks);
app.use('/api/posts', isAuthenticated, posts);
app.use('/api/upvotes', isAuthenticated, upvotes);
app.use('/api/comments', isAuthenticated, comments);
app.use('/api/notifications', isAuthenticated, notifications);
app.use('/api/groups', isAuthenticated, groups);
app.use('/api/auth', auth);
app.use('/api/trace', isAuthenticated, trace);
app.use('/api/todoItems', isAuthenticated, todoItems);
app.use('/api/learner', isAuthenticated, learner);
app.use('/api/ai', isAuthenticated, aiRouter);
app.use('/api/ai-agents', aiAgentRoutes);
app.use('/api/chat-history', chatHistoryRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/teacher-tasks', teacherTaskRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(staticFilesPath, 'index.html'));
});

const shutdown = async () => {
  console.log('Shutting down server...');
  try {
    await RedisClient.disconnect(); // Ensure Redis clients are closed
    console.log('Redis disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGINT', shutdown);

mongoose
  .connect(dbURI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(port);
    console.log('HTTP server running at ' + port);
  })
  .catch((err) => console.log(err));
