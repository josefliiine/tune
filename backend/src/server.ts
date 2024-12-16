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

  socket.on('authenticate', async ({ userId }) => {
    if (userId) {
      if ((socket as any).isAuthenticated) {
        console.log(`Socket ${socket.id} redan autentiserad som ${userId}`);
        return;
      }
      userIdToSocketId.set(userId, socket.id);
      console.log(`User authenticated: ${userId} with socket ID: ${socket.id}`);
      (socket as any).userId = userId;
      (socket as any).isAuthenticated = true;
  
      try {
        const pendingChallenges = await Challenge.find({ challengedId: userId, status: 'pending' });
        pendingChallenges.forEach(challenge => {
          socket.emit('challengeReceived', {
            challengeId: challenge._id,
            challengerId: challenge.challengerId,
            difficulty: challenge.difficulty,
          });
          console.log(`Emitted pending challenge to user ${userId}: ${challenge._id}`);
        });
      } catch (error) {
        console.error('Error fetching pending challenges:', error);
      }
    } else {
      console.warn(`No userId provided for socket ${socket.id}`);
    }
  });

  handleMatchmaking(socket, io, userIdToSocketId);
  handleGameEvents(socket, io);

  socket.on('challengeFriend', async ({ challengerId, challengedId, difficulty }) => {
    try {
      console.log(`Received challengeFriend event: challengerId=${challengerId}, challengedId=${challengedId}, difficulty=${difficulty}`);

      const newChallenge = await Challenge.create({ challengerId, challengedId, difficulty });

      const challengedSocketId = userIdToSocketId.get(challengedId);

      if (challengedSocketId) {
        io.to(challengedSocketId).emit('challengeReceived', {
          challengeId: newChallenge._id,
          challengerId,
          difficulty,
        });
        console.log(`Challenge sent from ${challengerId} to ${challengedId} with difficulty ${difficulty}`);
      } else {
        console.warn(`Challenged user ${challengedId} is not connected.`);
      }
    } catch (error) {
      console.error('Error sending challenge:', error);
      socket.emit('error', { message: 'Error sending challenge.' });
    }
  });

  socket.on('respondToChallenge', async ({ challengeId, response }) => {
    console.log(`Received respondToChallenge: challengeId=${challengeId}, response=${response}`);
    try {
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        socket.emit('error', { message: 'Challenge not found.' });
        console.log(`Challenge with ID ${challengeId} not found.`);
        return;
      }

      if (challenge.status !== 'pending') {
        socket.emit('error', { message: 'Challenge already responded to.' });
        console.log(`Challenge ${challengeId} already responded to.`);
        return;
      }

      challenge.status = response === 'accept' ? 'accepted' : 'declined';
      await challenge.save();
      console.log(`Challenge ${challengeId} status updated to ${challenge.status}`);

      const challengerSocketId = userIdToSocketId.get(challenge.challengerId);
      if (challengerSocketId) {
        io.to(challengerSocketId).emit('challengeResponse', {
          challengeId,
          response,
          challengedId: challenge.challengedId,
        });
        console.log(`Emitted challengeResponse to challenger ${challenge.challengerId}`);
      }

      if (response === 'accept') {
        const questions = await Question.aggregate([
          { $match: { difficulty: challenge.difficulty } },
          { $sample: { size: 10 } }
        ]);
        console.log(`Fetched ${questions.length} questions for the game with difficulty ${challenge.difficulty}`);

        const gameId = `friend-${challenge.challengerId}-${challenge.challengedId}-${Date.now()}`;
        const newGame = new Game({
          gameId,
          player1: challenge.challengerId,
          player2: challenge.challengedId,
          gameMode: 'friend',
          status: 'started',
          createdAt: new Date(),
          questions: questions.map(q => ({
            questionId: q._id.toString(),
            question: q.question,
            answers: q.answers,
            correctAnswer: q.correctAnswer,
          })),
          questionsCount: 10,
          player1Answers: [],
          player2Answers: [],
        });
        await newGame.save();
        console.log(`New game created with gameId: ${gameId}`);

        if (challengerSocketId) {
          const challengerSocket = io.sockets.sockets.get(challengerSocketId);
          if (challengerSocket) {
            challengerSocket.join(gameId);
            challengerSocket.emit('startGame', {
              gameId,
              quizQuestions: newGame.questions,
              opponent: challenge.challengedId,
            });
            console.log(`Emitted startGame to challenger ${challenge.challengerId}`);
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
            console.log(`Emitted startGame to challenged user ${challenge.challengedId}`);
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