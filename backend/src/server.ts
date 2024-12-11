import express from "express";
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import router, { handleMatchmaking, handleGameEvents } from "./routes";
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();

// CORS middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

app.use('/', router);

const frontendDistPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDistPath));

app.options('*', cors());

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not defined.');
  process.exit(1);
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const userIdToSocketId = new Map<string, string>();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('authenticate', (data) => {
    const { userId } = data;
    if (userId) {
      userIdToSocketId.set(userId, socket.id);
      console.log(`User authenticated: ${userId} with socket ID: ${socket.id}`);
    }
  });

  handleMatchmaking(socket, io, userIdToSocketId);
  handleGameEvents(socket, io);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const [userId, sockId] of userIdToSocketId.entries()) {
      if (sockId === socket.id) {
        userIdToSocketId.delete(userId);
        console.log(`User ${userId} removed from mapping.`);
        break;
      }
    }
  });
});

mongoose.connect(DATABASE_URL)
  .then(async () => {
    console.log('Connected to MongoDB');
    console.log('Connected to database:', mongoose.connection.db!.databaseName);

    const collections = await mongoose.connection.db!.collections();
    console.log('Collections:');
    collections.forEach(col => console.log(col.collectionName));

    server.listen(PORT, () => {
      console.log(`Backend is on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Can not connect to MongoDB', err);
  });