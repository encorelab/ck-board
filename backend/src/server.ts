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
import RedisClient from './utils/redis';
import Grid from 'gridfs-stream';
import multer from 'multer';
import { GridFSBucket } from 'mongodb';

dotenv.config();

const port = process.env.PORT || 8001;
const dbUsername = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbUrl = process.env.DB_URL;
const dbName = process.env.DB_NAME;
const dbURI = `mongodb+srv://${dbUsername}:${dbPassword}@${dbUrl}.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const redisPassword = process.env.REDIS_PASSWORD || '';

const app = express();
app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);

const redis = new RedisClient({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
});

const socket = Socket.Instance;
socket.init(redis);

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

const shutdown = async () => {
  await redis.disconnect();
  process.exit(0);
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

const connection = mongoose.connection;
let gfs: Grid.Grid;
let gridFSBucket: GridFSBucket; // Use GridFSBucket type directly

connection.once('open', () => {
  gridFSBucket = new GridFSBucket(connection.db, {
    bucketName: 'uploads',
  });
  gfs = Grid(connection.db, mongoose.mongo);
  gfs.collection('uploads'); // Set the GridFS collection
  console.log('MongoDB connected and GridFS set up');
});

const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({ storage });

// Upload image to MongoDB using GridFS
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const uploadStream = gridFSBucket.openUploadStream(req.file.originalname, {
    contentType: req.file.mimetype,
  });

  uploadStream.on('error', (error: Error) => {
    return res.status(500).send('Error uploading file: ' + error.message);
  });

  uploadStream.on('finish', () => {
    const fileId = uploadStream.id;

    // Return the uploaded file ID to the client
    res.status(201).json({
      message: 'File uploaded successfully',
      fileId: fileId,
      // Optionally return other details if needed
    });
  });

  uploadStream.end(req.file.buffer); // No callback here
});

// Delete image from MongoDB using GridFS
app.delete('/api/upload/:id', (req, res) => {
  const fileId = new mongoose.Types.ObjectId(req.params.id);

  gridFSBucket.delete(fileId, (err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: 'Error deleting file', error: err.message });
    }
    return res.status(200).json({ message: 'File deleted successfully' });
  });
});

app.get('/api/image/:id', (req, res) => {
  const fileId = new mongoose.Types.ObjectId(req.params.id);

  gfs.files.findOne({ _id: fileId }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    // File found, stream it to the response
    const readStream = gridFSBucket.openDownloadStream(file._id);
    readStream.pipe(res);
  });
});
