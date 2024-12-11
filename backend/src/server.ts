import express from "express";
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import router, { handleMatchmaking, handleGameEvents } from "./routes";
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server, Socket } from 'socket.io';
import Game from './models/Game';
import WaitingList from './models/WaitingList';

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

io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('authenticate', ({ userId }) => {
    if (userId) {
      userIdToSocketId.set(userId, socket.id);
      console.log(`User authenticated: ${userId} with socket ID: ${socket.id}`);
      (socket as any).userId = userId;
    }
  });

  handleMatchmaking(socket, io, userIdToSocketId);
  handleGameEvents(socket, io);

  socket.on('disconnect', async () => {
    const userId = (socket as any).userId;
    console.log(`User disconnected: ${socket.id}, userId: ${userId}`);
  
    if (userId) {
      userIdToSocketId.delete(userId);
      console.log(`User ${userId} removed from userIdToSocketId mapping.`);
  
      try {
        await WaitingList.deleteOne({ userId });
        console.log(`User ${userId} removed from waiting list.`);
  
        const activeGames = await Game.find({
          $or: [{ player1: userId }, { player2: userId }],
          status: { $ne: 'finished' },
        });
  
        for (const game of activeGames) {
          game.status = 'aborted';
          await game.save();
          console.log(`Game ${game.gameId} aborted due to user ${userId} disconnecting.`);
  
          const opponentId = game.player1 === userId ? game.player2 : game.player1;
  
          if (opponentId) {
            const opponentSocketId = userIdToSocketId.get(opponentId);
            if (opponentSocketId) {
              console.log(`Emitting 'gameAborted' to opponent's socket ID: ${opponentSocketId}`);
              io.to(opponentSocketId).emit('gameAborted', {
                message: 'Your opponent has left the game.',
              });
            } else {
              console.warn(`Opponent's socket ID not found for user ${opponentId}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error handling disconnect for user ${userId}:`, error);
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
      console.log(`Backend is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Cannot connect to MongoDB', err);
  });