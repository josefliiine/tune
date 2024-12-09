import express from 'express';
import WaitingList from '../models/WaitingList';
import Game from '../models/Game';
import Question from '../models/Question';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/join', authenticate, async (req, res) => {
  const { userId, difficulty } = req.body;

  if (!userId || !difficulty) {
    return res.status(400).json({ message: 'userId and difficulty are required.' });
  }

  try {
    // Add user to waitlist
    const existingEntry = await WaitingList.findOne({ userId });
    if (existingEntry) {
      existingEntry.status = 'waiting';
      existingEntry.difficulty = difficulty;
      existingEntry.opponent = null;
      await existingEntry.save();
    } else {
      await WaitingList.create({ userId, status: 'waiting', difficulty, opponent: null });
    }

    const matchedUser = await WaitingList.findOne({
      status: 'waiting',
      userId: { $ne: userId },
      difficulty: difficulty,
    });

    if (matchedUser) {
      await WaitingList.updateOne(
        { userId: userId },
        { status: 'matched', opponent: matchedUser.userId }
      );
      await WaitingList.updateOne(
        { userId: matchedUser.userId },
        { status: 'matched', opponent: userId }
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

export default router;