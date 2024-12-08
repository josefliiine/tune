import express from 'express';
import Question from '../models/Question';

const router = express.Router();

router.get('/', async (req, res) => {
    const { difficulty } = req.query;

    let filter = {};
    if (difficulty) {
        filter = { difficulty: difficulty as string };
    }

    try {
        const questions = await Question.find(filter);
        res.json(questions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something wrong with server.' });
    }
});

router.post('/', async (req, res) => {
    const { answers, correctAnswer, difficulty, question } = req.body;

    if (!answers || !correctAnswer || !difficulty || !question) {
        return res.status(400).json({ message: 'All fields must be filled in.' });
    }

    try {
        const newQuestion = new Question({ answers, correctAnswer, difficulty, question });
        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something wrong with server.' });
    }
});

export default router;