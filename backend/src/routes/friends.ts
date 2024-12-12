import express from 'express';
import { authenticate } from '../middleware/auth';
import { getMyFriends, removeFriend } from '../controllers/friendsController';

const router = express.Router();

router.get('/', authenticate, getMyFriends);

router.delete('/:friendId', authenticate, removeFriend);

export default router;