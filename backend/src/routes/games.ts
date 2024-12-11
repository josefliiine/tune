import express from 'express';
import Game, { IGame } from '../models/Game';
import { authenticate } from '../middleware/auth';
import Question from '../models/Question';
import { Socket, Server } from 'socket.io';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  const { gameMode, userId, difficulty } = req.body;

  if (gameMode === 'self') {
    try {
      const questions = await Question.aggregate([
        { $match: { difficulty } },
        { $sample: { size: 10 } }
      ]);

      const gameId = `self-${userId}-${Date.now()}`;
      const newGame = new Game({
        gameId,
        player1: userId,
        gameMode: 'self',
        status: "started",
        createdAt: new Date(),
        player1Answered: false,
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
      return res.status(201).json({ gameId, quizQuestions: newGame.questions });
    } catch (error) {
      console.error('Error creating self game:', error);
      return res.status(500).json({ message: 'Error creating game.' });
    }
  } else {
    return res.status(400).json({ message: 'Invalid game mode.' });
  }
});

export const handleGameEvents = (socket: Socket, io: Server) => {
  const timers: { [gameId: string]: NodeJS.Timeout } = {};

  const startTimer = async (gameId: string) => {
    const game = await Game.findOne({ gameId }) as IGame;
    if (!game) return;

    if (timers[gameId]) clearTimeout(timers[gameId]);

    timers[gameId] = setTimeout(async () => {
      console.log(`Timer expired for game ${gameId}`);
      const currentQuestion = game.questions[game.currentQuestionIndex];
      
      if (!game.player1Answered) {
        game.player1Answers.push(null);
      }
      if (game.gameMode === "random" && !game.player2Answered) {
        game.player2Answers.push(null);
      }

      game.player1Answered = false;
      game.player2Answered = false;

      if (game.currentQuestionIndex < game.questionsCount - 1) {
        game.currentQuestionIndex += 1;
        await game.save();

        const nextQuestion = game.questions[game.currentQuestionIndex];
        io.to(gameId).emit("nextQuestion", { currentQuestionIndex: game.currentQuestionIndex, question: nextQuestion });

        startTimer(gameId);
      } else {
        game.status = "finished";
        await game.save();
        io.to(gameId).emit("gameFinished", { message: "Game finished." });

        clearTimeout(timers[gameId]);
        delete timers[gameId];
      }
    }, 15000);
  };

  socket.on("joinGame", ({ gameId, userId }) => {
    socket.join(gameId);
    console.log(`User ${userId} joined game ${gameId}`);
  });

  socket.on("submitAnswer", async ({ gameId, userId, answer }) => {
    try {
      const game = await Game.findOne({ gameId }) as IGame;
      if (!game) {
        socket.emit("error", { message: "Game not found." });
        return;
      }

      const currentQuestion = game.questions[game.currentQuestionIndex];
      if (!currentQuestion) {
        socket.emit("error", { message: "No current question." });
        return;
      }

      const isCorrect = String(answer).trim() === String(currentQuestion.correctAnswer).trim();

      if (game.gameMode === "self") {
        game.player1Answers.push(answer);
        game.player1Answered = true;

        socket.emit("playerAnswered", { userId, isCorrect });

        if (game.currentQuestionIndex < game.questionsCount - 1) {
          game.currentQuestionIndex += 1;
          game.player1Answered = false;
          await game.save();
          const nextQuestion = game.questions[game.currentQuestionIndex];
          io.to(gameId).emit("nextQuestion", { currentQuestionIndex: game.currentQuestionIndex, question: nextQuestion });
          startTimer(gameId);
        } else {
          game.status = "finished";
          await game.save();
          io.to(gameId).emit("gameFinished", { message: "Game finished." });
        }
      } else {
        if (userId === game.player1) {
          game.player1Answered = true;
          game.player1Answers.push(answer);
        } else if (userId === game.player2) {
          game.player2Answered = true;
          game.player2Answers.push(answer);
        }

        await game.save();

        io.to(gameId).emit("playerAnswered", { userId, isCorrect });

        if (game.player1Answered && game.player2Answered) {
          if (game.currentQuestionIndex < game.questionsCount - 1) {
            game.currentQuestionIndex += 1;
            game.player1Answered = false;
            game.player2Answered = false;
            await game.save();
            const nextQuestion = game.questions[game.currentQuestionIndex];
            io.to(gameId).emit("nextQuestion", { currentQuestionIndex: game.currentQuestionIndex, question: nextQuestion });
            startTimer(gameId);
          } else {
            game.status = "finished";
            await game.save();
            io.to(gameId).emit("gameFinished", { message: "Game finished." });
            clearTimeout(timers[gameId]);
            delete timers[gameId];
          }
        }
      }
    } catch (error) {
      console.error("Error recording answer:", error);
      socket.emit("error", { message: "Error recording answer." });
    }
  });

  socket.on("disconnect", () => {
    for (const [gameId, timer] of Object.entries(timers)) {
      clearTimeout(timer);
      delete timers[gameId];
    }
  });
};

export default router;