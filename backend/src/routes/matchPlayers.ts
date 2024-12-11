import express from 'express';
import WaitingList from '../models/WaitingList';
import Game, { IGame } from '../models/Game';
import Question from '../models/Question';
import { Socket, Server } from 'socket.io';

const router = express.Router();

export const handleMatchmaking = (socket: Socket, io: Server, userIdToSocketId: Map<string, string>) => {
  socket.on("joinMatchmaking", async ({ userId, difficulty }) => {
    try {
      console.log(`User ${userId} is trying to join matchmaking with difficulty ${difficulty}`);

      // Add user to waitinglist
      const existingEntry = await WaitingList.findOne({ userId });
      if (existingEntry) {
        existingEntry.status = 'waiting';
        existingEntry.difficulty = difficulty;
        existingEntry.opponent = null;
        await existingEntry.save();
        console.log(`Updated existing waitlist entry for user ${userId}`);
      } else {
        await WaitingList.create({ userId, status: 'waiting', difficulty, opponent: null });
        console.log(`Created new waitlist entry for user ${userId}`);
      }

      // Find matching user
      const matchedUser = await WaitingList.findOne({
        status: 'waiting',
        userId: { $ne: userId },
        difficulty: difficulty,
      });

      if (matchedUser) {
        const matchedSocketId = userIdToSocketId.get(matchedUser.userId);

        if (matchedSocketId) {
          console.log(`Found a match for user ${userId}: ${matchedUser.userId}`);

          // Update status for both players
          await WaitingList.updateOne(
            { userId: userId },
            { status: 'matched', opponent: matchedUser.userId }
          );
          await WaitingList.updateOne(
            { userId: matchedUser.userId },
            { status: 'matched', opponent: userId }
          );
          console.log(`Updated waitlist status for user ${userId} and matched user ${matchedUser.userId}`);

          // Fetch questions
          const questions = await Question.aggregate([
            { $match: { difficulty } },
            { $sample: { size: 10 } }
          ]);
          console.log(`Fetched ${questions.length} questions for the game`);

          // Create new game -random
          const gameId = `random-${userId}-${Date.now()}`;
          const newGame = new Game({
            gameId,
            player1: userId,
            player2: matchedUser.userId,
            gameMode: 'random',
            status: 'started',
            createdAt: new Date(),
            player1Answered: false,
            player2Answered: false,
            currentQuestionIndex: 0,
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
          console.log(`New game created with gameId: ${gameId}`);

          // Remove from waitinglist
          await WaitingList.deleteMany({ userId: { $in: [userId, matchedUser.userId] } });
          console.log(`Removed users ${userId} and ${matchedUser.userId} from waiting list`);

          const currentSocketId = userIdToSocketId.get(userId);
          console.log(`Socket ID for matched user (${matchedUser.userId}): ${matchedSocketId}`);
          console.log(`Socket ID for current user (${userId}): ${currentSocketId}`);

          if (matchedSocketId) {
            const matchedSocket = io.sockets.sockets.get(matchedSocketId);
            if (matchedSocket) {
              matchedSocket.join(gameId);
              console.log(`Matched user ${matchedUser.userId} joined game ${gameId}`);
            } else {
              console.warn(`Socket for matched user ${matchedUser.userId} not found`);
              return;
            }
          } else {
            console.warn(`No socket ID found for matched user ${matchedUser.userId}`);
            return;
          }

          if (currentSocketId) {
            socket.join(gameId);
            console.log(`Current user ${userId} joined game ${gameId}`);
          } else {
            console.warn(`No socket ID found for user ${userId}`);
            return;
          }

          io.in(gameId).emit('matchFound', {
            gameId,
            quizQuestions: newGame.questions,
            opponent: matchedUser.userId,
          });
          console.log(`Emitted 'matchFound' to game room ${gameId}`);

        } else {
          console.log(`Matched user ${matchedUser.userId} is not connected, skipping match.`);
          await WaitingList.deleteOne({ userId: matchedUser.userId });
          console.log(`Removed disconnected user ${matchedUser.userId} from waiting list.`);
        }

      } else {
        console.log(`No match found for user ${userId}, emitting 'waitingForMatch'`);
        socket.emit("waitingForMatch");
      }

    } catch (error) {
      console.error('Error during matchmaking:', error);
      socket.emit("error", { message: 'Internal server error during matchmaking.' });
    }
  });
};

export default router;