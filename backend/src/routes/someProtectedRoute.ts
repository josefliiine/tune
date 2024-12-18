import express, { Request, Response } from 'express';
import { authenticate, RequestWithUser } from '../middleware/auth';

const router = express.Router();

router.get('/protected', authenticate, (req: Request, res: Response) => {
  const reqWithUser = req as RequestWithUser;
  const user = reqWithUser.user;

  const userName = user.name || 'Unknown';

  res.json({ message: `Hello, ${userName}` });
});

export default router;