import express from "express";
import questionsRouter from './questions';
import matchPlayersRouter, { handleMatchmaking } from './matchPlayers';
import someProtectedRoute from './someProtectedRoute';
import gamesRouter, { handleGameEvents } from './games';
import friendsRouter from './friends';
import usersRouter from './users';

const router = express.Router();

router.get("/", (req, res) => {
  res.send({
    message: "Greetings from backend",
  });
});

router.use('/questions', questionsRouter);
router.use('/match', matchPlayersRouter);
router.use('/protected', someProtectedRoute);
router.use('/games', gamesRouter);
router.use('/friends', friendsRouter);
router.use('/users', usersRouter);

router.use((req, res) => {
  res.status(404).send({
    message: "Not found",
  });
});

export default router;

export { handleMatchmaking, handleGameEvents };