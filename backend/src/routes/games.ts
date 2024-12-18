import express, { Request, Response } from 'express';
import Game, { IGame } from '../models/Game';
import { authenticate, RequestWithUser } from '../middleware/auth';
import Question from '../models/Question';
import { Socket, Server } from 'socket.io';
import admin from '../firebase';

const router = express.Router();

interface IQuestion {
  _id: string;
  question: string;
  answers: string[];
  correctAnswer: string;
}

export const handleGameEvents = async (
  socket: Socket,
  io: Server,
  userIdToSocketId: Map<string, string>
) => {
  async function sendGameResults(game: IGame, io: Server, gameId: string) {
    console.log(`Sending game results for gameId: ${gameId}`);

    if (game.gameMode === 'self') {
      const db = admin.firestore();
      const player1Doc = await db.collection('users').doc(game.player1).get();
      const player1Data = player1Doc.data();
      const player1Name = player1Data?.displayName || player1Data?.email || 'Unknown';

      console.log(`Calculating score for player1 (${player1Name})`);

      const player1Score = game.player1Answers.reduce((count, ans, i) => {
        const question = game.questions[i];
        if (question && ans && ans.trim() === question.correctAnswer.trim()) {
          return count + 1;
        }
        if (!question) {
          console.warn(`Question at index ${i} is undefined for gameId: ${gameId}`);
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
      const player1Name = player1Data?.displayName || player1Data?.email || 'Unknown';

      const player2Doc = await db.collection('users').doc(game.player2!).get();
      const player2Data = player2Doc.data();
      const player2Name = player2Data?.displayName || player2Data?.email || 'Unknown';

      console.log(`Calculating scores for player1 (${player1Name}) and player2 (${player2Name})`);

      const player1Score = game.player1Answers.reduce((count, ans, i) => {
        const question = game.questions[i];
        if (question && ans.trim() === question.correctAnswer.trim()) {
          return count + 1;
        }
        if (!question) {
          console.warn(`Question at index ${i} is undefined for player1 in gameId: ${gameId}`);
        }
        return count;
      }, 0);

      const player2Score = game.player2Answers.reduce((count, ans, i) => {
        const question = game.questions[i];
        if (question && ans.trim() === question.correctAnswer.trim()) {
          return count + 1;
        }
        if (!question) {
          console.warn(`Question at index ${i} is undefined for player2 in gameId: ${gameId}`);
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

  socket.on("joinGame", async ({ gameId, userId }: { gameId: string, userId: string }) => {
    socket.join(gameId);
    console.log(`User ${userId} joined game ${gameId}`);

    const game = await Game.findOne({ gameId }) as IGame;
    if (!game) {
      socket.emit("error", { message: "Game not found." });
      console.error(`Game not found: ${gameId}`);
      return;
    }

    console.log(`CurrentQuestionIndex: ${game.currentQuestionIndex}, QuestionsCount: ${game.questionsCount}`);

    if (game.currentQuestionIndex >= game.questions.length) {
      console.error(`currentQuestionIndex (${game.currentQuestionIndex}) exceeds questions length (${game.questions.length}) for gameId: ${gameId}`);
      socket.emit("error", { message: "No more questions available." });
      return;
    }

    if (game.status === "started" && game.currentQuestionIndex === 0) {
      const currentQuestion = game.questions[game.currentQuestionIndex];
      if (!currentQuestion) {
        console.warn(`No current question found at index ${game.currentQuestionIndex} for gameId: ${gameId}`);
        socket.emit("error", { message: "Current question not found." });
        return;
      }
      io.to(gameId).emit("nextQuestion", { 
        currentQuestionIndex: game.currentQuestionIndex, 
        question: currentQuestion
      });
      console.log(`Emitted nextQuestion for gameId: ${gameId}`);
    }
  });

  socket.on("submitAnswer", async ({ gameId, userId, answer }: { gameId: string, userId: string, answer: string }) => {
    try {
      const game = await Game.findOne({ gameId }) as IGame;
      if (!game) {
        socket.emit("error", { message: "Game not found." });
        console.error(`Game not found: ${gameId}`);
        return;
      }

      console.log(`Received answer from user ${userId} for gameId ${gameId}: ${answer}`);
      console.log(`CurrentQuestionIndex: ${game.currentQuestionIndex}, QuestionsCount: ${game.questionsCount}`);

      if (game.currentQuestionIndex >= game.questions.length) {
        console.error(`currentQuestionIndex (${game.currentQuestionIndex}) exceeds questions length (${game.questions.length}) for gameId: ${gameId}`);
        socket.emit("error", { message: "No more questions available." });
        return;
      }

      const currentQuestion = game.questions[game.currentQuestionIndex];
      if (!currentQuestion) {
        socket.emit("error", { message: "No current question." });
        console.warn(`No current question at index ${game.currentQuestionIndex} for gameId: ${gameId}`);
        return;
      }

      const isCorrect = String(answer).trim() === String(currentQuestion.correctAnswer).trim();
      console.log(`Answer is ${isCorrect ? 'correct' : 'incorrect'}`);

      if (game.gameMode === "self") {
        game.player1Answers.push(answer);
        game.player1Answered = true;

        socket.emit("playerAnswered", { userId, isCorrect });

        if (game.currentQuestionIndex < game.questionsCount - 1) {
          game.currentQuestionIndex += 1;
          game.player1Answered = false;
          await game.save();

          if (game.currentQuestionIndex >= game.questions.length) {
            console.error(`currentQuestionIndex (${game.currentQuestionIndex}) exceeds questions length (${game.questions.length}) for gameId: ${gameId}`);
            socket.emit("error", { message: "No more questions available." });
            return;
          }

          const nextQuestion = game.questions[game.currentQuestionIndex];
          if (!nextQuestion) {
            console.error(`Next question at index ${game.currentQuestionIndex} is undefined for gameId: ${gameId}`);
            socket.emit("error", { message: "Next question not found." });
            return;
          }

          io.to(gameId).emit("nextQuestion", { 
            currentQuestionIndex: game.currentQuestionIndex, 
            question: nextQuestion
          });
          console.log(`Emitted nextQuestion for gameId: ${gameId}`);
        } else {
          game.status = "finished";
          await game.save();
          io.to(gameId).emit("gameFinished", { message: "Game finished." });
          console.log(`Game ${gameId} finished. Sending results.`);
          await sendGameResults(game, io, gameId);
        }
      } else {
        if (userId === game.player1) {
          game.player1Answered = true;
          game.player1Answers.push(answer);
        } else if (userId === game.player2) {
          game.player2Answered = true;
          game.player2Answers.push(answer);
        } else {
          socket.emit("error", { message: "Invalid user in game." });
          console.warn(`User ${userId} is not a player in gameId: ${gameId}`);
          return;
        }

        await game.save();

        io.to(gameId).emit("playerAnswered", { userId, isCorrect });

        if (game.player1Answered && game.player2Answered) {
          if (game.currentQuestionIndex < game.questionsCount - 1) {
            game.currentQuestionIndex += 1;
            game.player1Answered = false;
            game.player2Answered = false;
            await game.save();

            if (game.currentQuestionIndex >= game.questions.length) {
              console.error(`currentQuestionIndex (${game.currentQuestionIndex}) exceeds questions length (${game.questions.length}) for gameId: ${gameId}`);
              socket.emit("error", { message: "No more questions available." });
              return;
            }

            const nextQuestion = game.questions[game.currentQuestionIndex];
            if (!nextQuestion) {
              console.error(`Next question at index ${game.currentQuestionIndex} is undefined for gameId: ${gameId}`);
              socket.emit("error", { message: "Next question not found." });
              return;
            }

            setTimeout(() => {
              io.to(gameId).emit("nextQuestion", { 
                currentQuestionIndex: game.currentQuestionIndex, 
                question: nextQuestion
              });
              console.log(`Emitted nextQuestion after delay for gameId: ${gameId}`);
            }, 3000);
          } else {
            game.status = "finished";
            await game.save();
            io.to(gameId).emit("gameFinished", { message: "Game finished." });
            console.log(`Game ${gameId} finished. Sending results.`);
            await sendGameResults(game, io, gameId);
          }
        }
      }
    } catch (error: unknown) {
      console.error("Error recording answer:", error);
      if (error instanceof Error) {
        socket.emit("error", { message: "Error recording answer." });
      }
    }
  });
};

router.post('/', authenticate, async (req: Request, res: Response) => {
  const reqWithUser = req as RequestWithUser;
  const { difficulty, gameMode } = req.body;

  try {
    if (gameMode !== 'self') {
      return res.status(400).json({ message: 'Invalid game mode. Only "self" is supported here.' });
    }

    const userId = reqWithUser.user.uid;

    const questions = await Question.aggregate([
      { $match: { difficulty } },
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

    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'No questions found for the specified difficulty.' });
    }

    console.log(`Questions fetched for 'self' game:`, questions);

    const gameId = `self-${userId}-${Date.now()}`;

    const newGame = new Game({
      gameId,
      player1: userId,
      player2: null,
      gameMode: 'self',
      status: 'started',
      createdAt: new Date(),
      questions: questions.map((q: IQuestion) => ({
        questionId: q._id,
        question: q.question,
        answers: q.answers,
        correctAnswer: q.correctAnswer,
      })),
      questionsCount: questions.length,
      currentQuestionIndex: 0,
      player1Answers: [],
      player2Answers: [],
      aborted: false,
    });

    if (newGame.questions.length !== newGame.questionsCount) {
      console.error('Mismatch between questions and questionsCount:', newGame.questions.length, newGame.questionsCount);
      return res.status(500).json({ message: 'Mismatch between questions and questionsCount.' });
    }

    await newGame.save();
    console.log(`Self game created: ${gameId}`);

    return res.json({
      gameId: newGame.gameId,
      quizQuestions: newGame.questions,
    });

  } catch (error: unknown) {
    console.error('Error creating self game:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
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

      if (game.aborted) {
        return {
          gameId: game.gameId,
          gameMode: game.gameMode,
          correctAnswers: null,
          result: 'aborted',
          createdAt: game.createdAt,
          aborted: true,
        };
      }

      if (game.gameMode === 'self') {
        correctAnswers = game.player1Answers.reduce((count, ans, idx) => {
          const question = game.questions[idx];
          if (question && ans && ans.trim() === question.correctAnswer.trim()) {
            return count + 1;
          }
          return count;
        }, 0);
      } else {
        const isPlayer1 = game.player1 === friendId;
        const userAnswers = isPlayer1 ? game.player1Answers : game.player2Answers;
        correctAnswers = userAnswers.reduce((count, ans, idx) => {
          const question = game.questions[idx];
          if (question && ans && ans.trim() === question.correctAnswer.trim()) {
            return count + 1;
          }
          return count;
        }, 0);
      }

      let result = 'draw';
      if (game.gameMode !== 'self') {
        const player1Score = game.player1Answers.reduce((count, ans, idx) => {
          const question = game.questions[idx];
          if (question && ans.trim() === question.correctAnswer.trim()) {
            return count + 1;
          }
          return count;
        }, 0);

        const player2Score = game.player2Answers.reduce((count, ans, idx) => {
          const question = game.questions[idx];
          if (question && ans.trim() === question.correctAnswer.trim()) {
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
        aborted: false,
      };
    });

    res.json(latestGames);
  } catch (error: unknown) {
    console.error("Error fetching friend's games:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: "Error fetching friend's games." });
    } else {
      res.status(500).json({ message: "An unexpected error occurred." });
    }
  }
});

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
        const question = game.questions[idx];
        if (!question) {
          console.warn(`Game ${game.gameId} has no question with index ${idx} for player1Answers.`);
          return count;
        }
        if (ans && ans.trim() === question.correctAnswer.trim()) {
          return count + 1;
        }
        return count;
      }, 0);

      let player2Score: number | null = null;
      if (game.player2) {
        player2Score = game.player2Answers.reduce((count, ans, idx) => {
          const question = game.questions[idx];
          if (!question) {
            console.warn(`Game ${game.gameId} has no question with index ${idx} for player2Answers.`);
            return count;
          }
          if (ans && ans.trim() === question.correctAnswer.trim()) {
            return count + 1;
          }
          return count;
        }, 0);
      }

      let result = 'draw';
      if (game.gameMode !== 'self') {
        if (player1Score > (player2Score ?? 0)) {
          result = 'win';
        } else if ((player2Score ?? 0) > player1Score) {
          result = 'lose';
        }
      } else {
        result = 'completed';
      }

      const isAborted = game.aborted;

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
          score: player2Score!,
        } : null,
        result,
        isAborted,
        createdAt: game.createdAt,
      };
    }));

    res.json(gamesWithUserNames);
  } catch (error: unknown) {
    console.error('Error fetching latest games:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error fetching latest games.' });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
});

export default router;