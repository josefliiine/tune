import express from "express";
import questionsRouter from './questions';
const router = express.Router();

router.get("/", (req, res) => {
    res.send({
        message: "Greetings from backend",
    });
});

router.use('/questions', questionsRouter);

router.use((req, res) => {
    res.status(404).send({
        message: "Not found",
    });
});

export default router;