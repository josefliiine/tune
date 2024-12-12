import express from "express";
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import router, { handleMatchmaking, handleGameEvents } from "./routes";
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server, Socket } from 'socket.io';
import Game, { IGame } from './models/Game';
import WaitingList from './models/WaitingList';
import Challenge from './models/Challenge';
import Question from './models/Question';

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
    } else {
      console.warn(`No userId provided for socket ${socket.id}`);
    }
  });

  handleMatchmaking(socket, io, userIdToSocketId);
  handleGameEvents(socket, io);

  socket.on('challengeFriend', async ({ challengerId, challengedId }) => {
    try {
      console.log(`Received challengeFriend event: challengerId=${challengerId}, challengedId=${challengedId}`);

      // Create new challenge in database
      const newChallenge = await Challenge.create({ challengerId, challengedId });

      const challengedSocketId = userIdToSocketId.get(challengedId);

      if (challengedSocketId) {
        io.to(challengedSocketId).emit('challengeReceived', {
          challengeId: newChallenge._id,
          challengerId,
        });
        console.log(`Challenge sent from ${challengerId} to ${challengedId}`);
      } else {
        console.warn(`Challenged user ${challengedId} is not connected.`);
        // Implement fallback!
      }
    } catch (error) {
      console.error('Error sending challenge:', error);
      socket.emit('error', { message: 'Error sending challenge.' });
    }
  });

  socket.on('respondToChallenge', async ({ challengeId, response }) => {
    try {
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        socket.emit('error', { message: 'Challenge not found.' });
        return;
      }
  
      challenge.status = response === 'accept' ? 'accepted' : 'declined';
      await challenge.save();
  
      const challengerSocketId = userIdToSocketId.get(challenge.challengerId);
      if (challengerSocketId) {
        io.to(challengerSocketId).emit('challengeResponse', {
          challengeId,
          response,
          challengedId: challenge.challengedId,
        });
      }
  
      if (response === 'accept') {
        // Create a new game
        const questions = await Question.aggregate([
          { $match: { difficulty: 'Easy' } },
          { $sample: { size: 10 } }
        ]);
  
        const gameId = `friend-${challenge.challengerId}-${challenge.challengedId}-${Date.now()}`;
        const newGame = new Game({
          gameId,
          player1: challenge.challengerId,
          player2: challenge.challengedId,
          gameMode: 'friend',
          status: 'started',
          createdAt: new Date(),
          questions: questions.map(q => ({
            questionId: q._id,
            question: q.question,
            answers: q.answers,
            correctAnswer: q.correctAnswer,
          })),
          questionsCount: 10,
          player1Answers: [],
          player2Answers: [],
        });
        await newGame.save();
  
        // Add both players to game
        if (challengerSocketId) {
          const challengerSocket = io.sockets.sockets.get(challengerSocketId);
          if (challengerSocket) {
            challengerSocket.join(gameId);
            challengerSocket.emit('startGame', {
              gameId,
              quizQuestions: newGame.questions,
              opponent: challenge.challengedId,
            });
          }
        }
  
        const challengedSocketId = userIdToSocketId.get(challenge.challengedId);
        if (challengedSocketId) {
          const challengedSocket = io.sockets.sockets.get(challengedSocketId);
          if (challengedSocket) {
            challengedSocket.join(gameId);
            challengedSocket.emit('startGame', {
              gameId,
              quizQuestions: newGame.questions,
              opponent: challenge.challengerId,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error responding to challenge:', error);
      socket.emit('error', { message: 'Error responding to challenge.' });
    }
  });

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