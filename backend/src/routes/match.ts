import express from 'express';
import WaitingList from '../models/WaitingList';
import Game from '../models/Game';
import Question from '../models/Question';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// POST /api/match/join
router.post('/join', authenticate, async (req, res) => {
  const { userId, difficulty } = req.body;

  if (!userId || !difficulty) {
    return res.status(400).json({ message: 'userId and difficulty are required.' });
  }

  try {
    const existingEntry = await WaitingList.findOne({ userId });
    if (existingEntry) {
      existingEntry.status = 'waiting';
      existingEntry.difficulty = difficulty;
      existingEntry.opponent = null;
      await existingEntry.save();
    } else {
      await WaitingList.create({ userId, status: 'waiting', difficulty });
    }

    const matchedUser = await WaitingList.findOne({
      status: 'waiting',
      userId: { $ne: userId },
      difficulty: difficulty,
    });

    if (matchedUser) {
      await WaitingList.updateMany(
        { userId: { $in: [userId, matchedUser.userId] } },
        { status: 'matched', opponent: { $in: [matchedUser.userId, userId] } }
      );

      const questions = await Question.aggregate([
        { $match: { difficulty } },
        { $sample: { size: 10 } }
      ]);

      const gameId = `random-${userId}-${Date.now()}`;
      const newGame = new Game({
        gameId,
        player1: userId,
        player2: matchedUser.userId,
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
      });
      await newGame.save();

      await WaitingList.deleteMany({ userId: { $in: [userId, matchedUser.userId] } });

      res.status(201).json({ gameId, quizQuestions: newGame.questions });
    } else {
      res.status(200).json({ message: 'Waiting for a match.', opponent: null });
    }
  } catch (error) {
    console.error('Error joining matchmaking:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/match/status?userId=
router.get('/status', authenticate, async (req, res) => {
    const { userId } = req.query;
  
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'userId is required as a string.' });
    }
  
    try {
      const entry = await WaitingList.findOne({ userId });
  
      if (entry && entry.status === 'matched') {
        const game = await Game.findOne({ $or: [{ player1: userId }, { player2: userId }] });
        if (game) {
          res.json({ 
            status: 'matched', 
            gameId: game.gameId, 
            opponent: game.player2 === userId ? game.player1 : game.player2 
          });
        } else {
          res.json({ status: 'waiting', opponent: entry.opponent });
        }
      } else if (entry && entry.status === 'waiting') {
        res.json({ status: 'waiting', opponent: null });
      } else {
        res.json({ status: null, opponent: null });
      }
    } catch (error) {
      console.error('Error checking match status:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });

export default router;