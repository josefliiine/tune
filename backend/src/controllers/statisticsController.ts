import { Request, Response } from 'express';
import Game from '../models/Game';

export const getUserStatistics = async (req: Request, res: Response) => {
    const userId = (req as any).user.uid;

    try {
        const games = await Game.find({
            $or: [{ player1: userId }, { player2: userId }]
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();

        const statistics = games.map((game) => {
            let correctAnswers = 0;
            if (game.gameMode === 'self') {
                correctAnswers = game.player1Answers.reduce((count, ans, idx) => {
                    if (ans && ans.trim() === game.questions[idx].correctAnswer.trim()) {
                        return count + 1;
                    }
                    return count;
                }, 0);
            } else {
                const isPlayer1 = game.player1 === userId;
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
    } catch (error) {
        console.error('Error fetching user statistics:', error);
        res.status(500).json({ message: 'Error fetching user statistics.' });
    }
};