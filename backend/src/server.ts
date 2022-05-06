import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Socket from './socket/socket';
dotenv.config();

const port = process.env.PORT || 8000;
const dbUsername = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbURI = `mongodb+srv://${dbUsername}:${dbPassword}@ck-board-cluster.f2vut.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const app = express();
const server = http.createServer(app);

const socket = new Socket();
socket.init(server);

mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(port);
    console.log("App running at " + port);
  })
  .catch((err) => console.log(err));
