import { Request, Response } from 'express';
import admin from '../firebase';

interface Friend {
  id: string;
  displayName?: string;
  email?: string;
}

export const getMyFriends = async (req: Request, res: Response) => {
  const userId = (req as any).user.uid;
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
          id: friendId,
          displayName: userDoc.data()?.displayName,
          email: userDoc.data()?.email,
        });
      }
    }

    console.log(`User ${userId} has friends:`, friends);
    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Error fetching friends.' });
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  const userId = (req as any).user.uid;
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
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Error removing friend.' });
  }
};