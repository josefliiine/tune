import express, { Request, Response } from 'express';
import Game, { IGame } from '../models/Game';
import { authenticate } from '../middleware/auth';
import Question from '../models/Question';
import { Socket, Server } from 'socket.io';
import admin from '../firebase';

const router = express.Router();

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId, difficulty, gameMode } = req.body;

    if (gameMode !== 'self') {
      return res.status(400).json({ message: 'Invalid game mode. Only "self" is supported here.' });
    }

    const questions = await Question.aggregate([
      { $match: { difficulty } },
      { $sample: { size: 10 } }
    ]);

    const gameId = `self-${userId}-${Date.now()}`;

    const newGame = new Game({
      gameId,
      player1: userId,
      player2: null,
      gameMode: 'self',
      status: 'started',
      createdAt: new Date(),
      questions: questions.map((q: any) => ({
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

    return res.json({
      gameId: newGame.gameId,
      quizQuestions: newGame.questions,
    });

  } catch (error) {
    console.error('Error creating self game:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/friends/:friendId/games', authenticate, async (req: Request, res: Response) => {
  const friendId = req.params.friendId;

  try {
    const games = await Game.find({
      $or: [{ player1: friendId }, { player2: friendId }]
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .exec();

    const latestGames = games.map((game: IGame) => {
      let correctAnswers = 0;
      if (game.gameMode === 'self') {
        correctAnswers = game.player1Answers.reduce((count, ans, idx) => {
          if (ans && ans.trim() === game.questions[idx].correctAnswer.trim()) {
            return count + 1;
          }
          return count;
        }, 0);
      } else {
        const isPlayer1 = game.player1 === friendId;
        const userAnswers = isPlayer1 ? game.player1Answers : game.player2Answers;
        correctAnswers = userAnswers.reduce((count, ans, idx) => {
          if (ans && ans.trim() === game.questions[idx].correctAnswer.trim()) {
            return count + 1;
          }
          return count;
        }, 0);
      }

      let result = 'draw';
      if (game.gameMode !== 'self') {
        const player1Score = game.player1Answers.reduce((count, ans, idx) => {
          if (ans && ans.trim() === game.questions[idx].correctAnswer.trim()) {
            return count + 1;
          }
          return count;
        }, 0);
        const player2Score = game.player2Answers.reduce((count, ans, idx) => {
          if (ans && ans.trim() === game.questions[idx].correctAnswer.trim()) {
            return count + 1;
          }
          return count;
        }, 0);
        if (player1Score > player2Score) {
          result = game.player1 === friendId ? 'win' : 'lose';
        } else if (player2Score > player1Score) {
          result = game.player2 === friendId ? 'win' : 'lose';
        }
      } else {
        result = 'completed';
      }

      return {
        gameId: game.gameId,
        gameMode: game.gameMode,
        correctAnswers,
        result,
        createdAt: game.createdAt,
      };
    });

    res.json(latestGames);
  } catch (error) {
    console.error('Error fetching friend\'s games:', error);
    res.status(500).json({ message: 'Error fetching friend\'s games.' });
  }
});

export const handleGameEvents = (socket: Socket, io: Server) => {
  async function sendGameResults(game: IGame, io: Server, gameId: string) {
    if (game.gameMode === 'self') {
      const db = admin.firestore();
      const player1Doc = await db.collection('users').doc(game.player1).get();
      const player1Data = player1Doc.data();
      const player1Name = player1Data?.displayName || player1Data?.email;

      const player1Score = game.player1Answers.reduce((count, ans, i) => {
        if (ans && ans.trim() === game.questions[i].correctAnswer.trim()) {
          return count + 1;
        }
        return count;
      }, 0);

      io.to(gameId).emit("gameResults", {
        player1: { id: game.player1, name: player1Name, score: player1Score },
        player2: null,
        winner: player1Name
      });
    } else {
      const db = admin.firestore();

      const player1Doc = await db.collection('users').doc(game.player1).get();
      const player1Data = player1Doc.data();
      const player1Name = player1Data?.displayName || player1Data?.email;

      const player2Doc = await db.collection('users').doc(game.player2!).get();
      const player2Data = player2Doc.data();
      const player2Name = player2Data?.displayName || player2Data?.email;

      const player1Score = game.player1Answers.reduce((count, ans, i) => {
        if (ans && ans.trim() === game.questions[i].correctAnswer.trim()) {
          return count + 1;
        }
        return count;
      }, 0);

      const player2Score = game.player2Answers.reduce((count, ans, i) => {
        if (ans && ans.trim() === game.questions[i].correctAnswer.trim()) {
          return count + 1;
        }
        return count;
      }, 0);

      let winner = 'draw';
      if (player1Score > player2Score) {
        winner = player1Name;
      } else if (player2Score > player1Score) {
        winner = player2Name;
      }

      io.to(gameId).emit("gameResults", {
        player1: { id: game.player1, name: player1Name, score: player1Score },
        player2: { id: game.player2, name: player2Name, score: player2Score },
        winner
      });
    }
  }

  socket.on("joinGame", async ({ gameId, userId }) => {
    socket.join(gameId);
    console.log(`User ${userId} joined game ${gameId}`);

    const game = await Game.findOne({ gameId }) as IGame;
    if (!game) {
      socket.emit("error", { message: "Game not found." });
      return;
    }

    if (game.status === "started" && game.currentQuestionIndex === 0) {
      const currentQuestion = game.questions[game.currentQuestionIndex];
      io.to(gameId).emit("nextQuestion", { 
        currentQuestionIndex: game.currentQuestionIndex, 
        question: currentQuestion
      });
    }
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
          
          setTimeout(() => {
            io.to(gameId).emit("nextQuestion", { 
              currentQuestionIndex: game.currentQuestionIndex, 
              question: nextQuestion
            });
          }, 3000);
        } else {
          game.status = "finished";
          await game.save();
          io.to(gameId).emit("gameFinished", { message: "Game finished." });
          await sendGameResults(game, io, gameId);
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
            setTimeout(() => {
              io.to(gameId).emit("nextQuestion", { 
                currentQuestionIndex: game.currentQuestionIndex, 
                question: nextQuestion
              });
            }, 3000);
          } else {
            game.status = "finished";
            await game.save();
            io.to(gameId).emit("gameFinished", { message: "Game finished." });
            await sendGameResults(game, io, gameId);
          }
        }
      }
    } catch (error) {
      console.error("Error recording answer:", error);
      socket.emit("error", { message: "Error recording answer." });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    io.emit("gameAborted", { message: "A player has disconnected. Game aborted." });
  });
};

router.get('/latest', authenticate, async (req: Request, res: Response) => {
  try {
    const latestGames = await Game.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    const gamesWithUserNames = await Promise.all(latestGames.map(async (game: IGame) => {
      const db = admin.firestore();

      const player1Doc = await db.collection('users').doc(game.player1).get();
      const player1Data = player1Doc.exists ? player1Doc.data() : null;
      const player1Name = player1Data?.displayName || player1Data?.email || 'Unknown';

      let player2Name = null;
      if (game.player2) {
        const player2Doc = await db.collection('users').doc(game.player2).get();
        const player2Data = player2Doc.exists ? player2Doc.data() : null;
        player2Name = player2Data?.displayName || player2Data?.email || 'Unknown';
      }

      const player1Score = game.player1Answers.reduce((count, ans, idx) => {
        if (ans && ans.trim() === game.questions[idx].correctAnswer.trim()) {
          return count + 1;
        }
        return count;
      }, 0);

      let player2Score = null;
      if (game.player2) {
        player2Score = game.player2Answers.reduce((count, ans, idx) => {
          if (ans && ans.trim() === game.questions[idx].correctAnswer.trim()) {
            return count + 1;
          }
          return count;
        }, 0);
      }

      let result = 'draw';
      if (game.gameMode !== 'self') {
        if (player1Score > player2Score!) {
          result = 'win';
        } else if (player2Score! > player1Score) {
          result = 'lose';
        }
      } else {
        result = 'completed';
      }

      return {
        gameId: game.gameId,
        gameMode: game.gameMode,
        player1: {
          id: game.player1,
          name: player1Name,
          score: player1Score,
        },
        player2: game.player2 ? {
          id: game.player2,
          name: player2Name,
          score: player2Score,
        } : null,
        result,
        createdAt: game.createdAt,
      };
    }));

    res.json(gamesWithUserNames);
  } catch (error) {
    console.error('Error fetching latest games:', error);
    res.status(500).json({ message: 'Error fetching latest games.' });
  }
});

export default router;