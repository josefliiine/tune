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

interface CustomSocket extends Socket {
  userId?: string;
  isAuthenticated?: boolean;
}

const userIdToSocketId = new Map<string, string>();

io.on('connection', (socket: CustomSocket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('authenticate', async ({ userId }: { userId: string }) => {
    if (userId) {
      if (socket.isAuthenticated) {
        console.log(`Socket ${socket.id} already authenticated as ${userId}`);
        return;
      }
      userIdToSocketId.set(userId, socket.id);
      console.log(`User authenticated: ${userId} with socket ID: ${socket.id}`);
      socket.userId = userId;
      socket.isAuthenticated = true;

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
      } catch (error: unknown) {
        console.error('Error fetching pending challenges:', error);
      }
    } else {
      console.warn(`No userId provided for socket ${socket.id}`);
    }
  });

  handleMatchmaking(socket, io, userIdToSocketId);
  handleGameEvents(socket, io, userIdToSocketId);

  socket.on('challengeFriend', async ({ challengerId, challengedId, difficulty }: { challengerId: string, challengedId: string, difficulty: string }) => {
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
    } catch (error: unknown) {
      console.error('Error sending challenge:', error);
      if (error instanceof Error) {
        socket.emit('error', { message: 'Error sending challenge.' });
      }
    }
  });

  socket.on('respondToChallenge', async ({ challengeId, response }: { challengeId: string, response: 'accept' | 'decline' }) => {
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
          { $sample: { size: 10 } },
          {
            $project: {
              questionId: { $toString: '$_id' },
              question: 1,
              answers: 1,
              correctAnswer: 1,
            }
          }
        ]);
        console.log(`Fetched ${questions.length} questions för spelet med svårighetsgrad ${challenge.difficulty}`);

        const gameId = `friend-${challenge.challengerId}-${challenge.challengedId}-${Date.now()}`;
        const newGame = new Game({
          gameId,
          player1: challenge.challengerId,
          player2: challenge.challengedId,
          gameMode: 'friend',
          status: 'started',
          createdAt: new Date(),
          questions: questions.map((q: any) => ({
            questionId: q.questionId,
            question: q.question,
            answers: q.answers,
            correctAnswer: q.correctAnswer,
          })),
          questionsCount: 10,
          player1Answers: [],
          player2Answers: [],
          aborted: false,
        });
        await newGame.save();
        console.log(`Nytt spel skapat med gameId: ${gameId}`);

        if (challengerSocketId) {
          const challengerSocket = io.sockets.sockets.get(challengerSocketId);
          if (challengerSocket) {
            challengerSocket.join(gameId);
            challengerSocket.emit('startGame', {
              gameId,
              quizQuestions: newGame.questions,
              opponent: challenge.challengedId,
            });
            console.log(`Emitted startGame till challenger ${challenge.challengerId}`);
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
            console.log(`Emitted startGame till utmanad användare ${challenge.challengedId}`);
          }
        }
      }
    } catch (error: unknown) {
      console.error('Error responding to challenge:', error);
      if (error instanceof Error) {
        socket.emit('error', { message: 'Error responding to challenge.' });
      }
    }
  });

  socket.on('disconnect', async () => {
    const userId = socket.userId;
    console.log(`User disconnected: ${socket.id}, userId: ${userId}`);

    if (userId) {
      userIdToSocketId.delete(userId);
      console.log(`User ${userId} removed från userIdToSocketId mapping.`);

      try {
        await WaitingList.deleteOne({ userId });
        console.log(`User ${userId} removed från waiting list.`);

        const activeGames: IGame[] = await Game.find({
          $or: [{ player1: userId }, { player2: userId }],
          status: { $nin: ['finished', 'aborted'] },
        }).exec();

        console.log(`Found ${activeGames.length} active game(s) för user ${userId}.`);

        for (const game of activeGames) {
          if (game.gameMode === 'self') {
            continue;
          }

          game.status = 'aborted';
          game.aborted = true;
          await game.save();
          console.log(`Game ${game.gameId} aborted på grund av att user ${userId} kopplade från.`);

          const opponentId: string | null = game.player1 === userId ? game.player2 : game.player1;

          if (opponentId) {
            const opponentSocketId = userIdToSocketId.get(opponentId);
            if (opponentSocketId) {
              console.log(`Emitting 'gameAborted' till opponent ${opponentId} (socket ID: ${opponentSocketId})`);
              io.to(opponentSocketId).emit('gameAborted', {
                message: 'Din motståndare har lämnat spelet.',
              });
              console.log(`'gameAborted' skickat till ${opponentId} (socket ID: ${opponentSocketId})`);
            } else {
              console.warn(`Opponentens socket ID hittades inte för user ${opponentId}. De kanske är offline.`);
            }
          } else {
            console.warn(`Ingen opponent hittades för game ${game.gameId}.`);
          }
        }
      } catch (error: unknown) {
        console.error(`Error hantering av disconnect för user ${userId}:`, error);
      }
    } else {
      console.warn(`Disconnected socket ${socket.id} hade ingen associerad userId.`);
    }
  });
});

mongoose.connect(DATABASE_URL)
  .then(async () => {
    console.log('Connected to MongoDB');
    console.log('Connected to database:', mongoose.connection.db?.databaseName);

    const collections = await mongoose.connection.db?.collections();
    if (collections) {
      console.log('Collections:');
      collections.forEach(col => console.log(col.collectionName));
    }

    server.listen(PORT, () => {
      console.log(`Backend körs på http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Cannot connect to MongoDB', err);
  });