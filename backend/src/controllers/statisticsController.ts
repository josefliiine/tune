import { Request, Response } from 'express';
import Game from '../models/Game';
import { RequestWithUser } from '../middleware/auth';

export const getUserStatistics = async (req: Request, res: Response) => {
  const reqWithUser = req as RequestWithUser;
  const userId = reqWithUser.user.uid;

  try {
    const games = await Game.find({
      $or: [{ player1: userId }, { player2: userId }],
      status: 'finished'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .exec();

    const statistics = games.map((game) => {
      let correctAnswers = 0;
      if (game.gameMode === 'self') {
        correctAnswers = game.player1Answers.reduce((count, ans, idx) => {
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
      } else {
        const isPlayer1 = game.player1 === userId;
        const userAnswers = isPlayer1 ? game.player1Answers : game.player2Answers;
        correctAnswers = userAnswers.reduce((count, ans, idx) => {
          const question = game.questions[idx];
          if (!question) {
            console.warn(`Game ${game.gameId} has no question with index ${idx} for userAnswers.`);
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
        const player2Score = game.player2Answers.reduce((count, ans, idx) => {
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
        if (player1Score > player2Score) {
          result = game.player1 === userId ? 'win' : 'lose';
        } else if (player2Score > player1Score) {
          result = game.player2 === userId ? 'win' : 'lose';
        }
      } else {
        result = 'completed';
      }

      return {
        gameMode: game.gameMode,
        correctAnswers,
        result,
        createdAt: game.createdAt,
      };
    });

    res.json(statistics);
  } catch (error: unknown) {
    console.error('Error fetching user statistics:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error fetching user statistics.' });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};