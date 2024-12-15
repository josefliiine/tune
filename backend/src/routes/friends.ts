import express, { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import admin from "../firebase";

const router = express.Router();

router.get('/:userId/list', authenticate, async (req: Request, res: Response) => {
    const userId = req.params.userId;

    try {
        const db = admin.firestore();
        const friendsSnapshot = await db.collection('friends').doc(userId).collection('userFriends').get();

        const friends: { friendId: string, friendName: string, friendEmail: string }[] = [];

        for (const doc of friendsSnapshot.docs) {
            const friendId = doc.id;
            const friendData = doc.data();

            const userDoc = await db.collection('users').doc(friendId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                friends.push({
                    friendId,
                    friendName: userData?.displayName || userData?.email || 'Unknown',
                    friendEmail: userData?.email || 'Unknown',
                });
            }
        }

        res.json(friends);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ message: 'Error fetching friends.' });
    }
});

router.delete('/:userId/remove', authenticate, async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const { friendId } = req.body;

    try {
        const db = admin.firestore();

        await db.collection('friends').doc(userId).collection('userFriends').doc(friendId).delete();

        await db.collection('friends').doc(friendId).collection('userFriends').doc(userId).delete();

        res.json({ message: 'Friend removed successfully.' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ message: 'Error removing friend.' });
    }
});

export default router;