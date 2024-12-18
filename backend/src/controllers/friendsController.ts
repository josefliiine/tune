import { Request, Response } from 'express';
import admin from '../firebase';
import { RequestWithUser } from '../middleware/auth';

interface Friend {
  friendId: string;
  friendName?: string;
  friendEmail?: string;
}

export const getMyFriends = async (req: Request, res: Response) => {
  const reqWithUser = req as RequestWithUser;
  const userId = reqWithUser.user.uid;
  const db = admin.firestore();

  try {
    const friendsRef = db.collection("friends");
    const friendsQuery = friendsRef.where("userId", "==", userId).where("status", "==", "accepted");
    const querySnapshot = await friendsQuery.get();
    const friends: Friend[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const friendId = data.friendId;
      const userDoc = await db.collection('users').doc(friendId).get();
      if (userDoc.exists) {
        friends.push({
          friendId: friendId,
          friendName: userDoc.data()?.displayName,
          friendEmail: userDoc.data()?.email,
        });
      }
    }

    console.log(`User ${userId} has friends:`, friends);
    res.json(friends);
  } catch (error: unknown) {
    console.error('Error fetching friends:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error fetching friends.' });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  const reqWithUser = req as RequestWithUser;
  const userId = reqWithUser.user.uid;
  const { friendId } = req.params;

  if (!friendId) {
    return res.status(400).json({ message: 'Friend ID is required.' });
  }

  const db = admin.firestore();

  try {
    const friendsRef = db.collection("friends");
    const friendQuery = friendsRef
      .where("userId", "==", userId)
      .where("friendId", "==", friendId)
      .limit(1);

    const querySnapshot = await friendQuery.get();

    if (querySnapshot.empty) {
      return res.status(404).json({ message: 'Friend relationship not found.' });
    }

    const docId = querySnapshot.docs[0].id;
    await friendsRef.doc(docId).delete();

    console.log(`Friendship between ${userId} and ${friendId} has been removed.`);
    res.json({ message: 'Friend removed successfully.' });
  } catch (error: unknown) {
    console.error('Error removing friend:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error removing friend.' });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};