import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/protected', authenticate, (req, res) => {
  const user = (req as any).user;
  res.json({ message: `Hello, ${user.name}` });
});

export default router;