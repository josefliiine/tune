import express from 'express';
import Game, { IGame } from '../models/Game';
import WaitingList from '../models/WaitingList';
import { authenticate } from '../middleware/auth';
import Question from '../models/Question';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
      const games = await Game.find();
      res.json(games);
    } catch (error) {
      console.error('Error fetching games:', error);
      res.status(500).json({ message: 'Error fetching games.' });
    }
  });

// POST /api/games
router.post('/', authenticate, async (req, res) => {
    const { gameMode, userId, difficulty } = req.body;
  
    if (gameMode === 'self') {
      try {
        const questions = await Question.aggregate([{ $match: { difficulty } }, { $sample: { size: 10 } }]);
        const gameId = `self-${userId}-${Date.now()}`;
        const newGame = new Game({
          gameId,
          player1: userId,
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
        });
        await newGame.save();
        return res.status(201).json({ gameId, quizQuestions: newGame.questions });
      } catch (error) {
        console.error('Error creating self game:', error);
        return res.status(500).json({ message: 'Error creating game.' });
      }
    } else if (gameMode === 'random') {
      try {
        let waitingPlayer = await WaitingList.findOne({ difficulty });
  
        if (waitingPlayer) {
          const questions = await Question.aggregate([{ $match: { difficulty } }, { $sample: { size: 10 } }]);
          const gameId = `random-${Date.now()}`;
          const newGame = new Game({
            gameId,
            player1: waitingPlayer.userId,
            player2: userId,
            status: "started",
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
  
          await WaitingList.deleteOne({ _id: waitingPlayer._id });
  
          return res.status(201).json({
            gameId,
            quizQuestions: newGame.questions,
            opponent: waitingPlayer.userId,
          });
        } else {
          const newWaitingPlayer = new WaitingList({
            userId,
            difficulty,
          });
          await newWaitingPlayer.save();
          return res.status(200).json({ message: "Waiting for opponent..." });
        }
      } catch (error) {
        console.error('Error in matchmaking:', error);
        return res.status(500).json({ message: 'Error in matchmaking.' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid game mode.' });
    }
  });

// GET /api/games/:gameId
router.get('/:gameId', authenticate, async (req, res) => {
  const { gameId } = req.params;
  try {
    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }
    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ message: 'Error fetching game.' });
  }
});

// PUT /api/games/:gameId/next-question
router.put('/:gameId/next-question', authenticate, async (req, res) => {
  const { gameId } = req.params;
  try {
    const game = await Game.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }

    if (game.currentQuestionIndex < game.questionsCount) {
      game.currentQuestionIndex += 1;
      game.player1Answered = false;
      game.player2Answered = false;
      await game.save();
      res.json({ message: 'Next question updated.', currentQuestionIndex: game.currentQuestionIndex });
    } else {
      game.status = 'finished';
      await game.save();
      res.json({ message: 'Game finished.' });
    }
  } catch (error) {
    console.error('Error updating next question:', error);
    res.status(500).json({ message: 'Error updating game.' });
  }
});

// POST /api/games/:gameId/answer
router.post('/:gameId/answer', authenticate, async (req, res) => {
    const { gameId } = req.params;
    const { userId, answer } = req.body;
  
    try {
      const game = await Game.findOne({ gameId }) as IGame;
      if (!game) {
        return res.status(404).json({ message: 'Game not found.' });
      }
  
      const currentQuestion = game.questions[game.currentQuestionIndex];
      if (!currentQuestion) {
        return res.status(400).json({ message: 'No current question.' });
      }
  
      const isCorrect = answer === currentQuestion.correctAnswer;
  
      if (userId === game.player1) {
        game.player1Answered = true;
        game.player1Answers.push(answer);
      } else if (userId === game.player2) {
        game.player2Answered = true;
        game.player2Answers.push(answer);
      } else {
        return res.status(403).json({ message: 'User not part of this game.' });
      }
  
      await game.save();
      res.json({ message: 'Answer recorded.', isCorrect });
    } catch (error) {
      console.error('Error recording answer:', error);
      res.status(500).json({ message: 'Error recording answer.' });
    }
  });

  export default router;