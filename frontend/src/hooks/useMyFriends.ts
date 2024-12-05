import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";

interface Friend {
  id: string;
  friendId: string;
  friendName?: string;
  friendEmail?: string;
}

const useMyFriends = (currentUserId: string | null) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const friendsQuery = query(
      collection(db, "friendsList"),
      where("userId", "==", currentUserId)
    );

    const unsubscribe = onSnapshot(
      friendsQuery,
      async (snapshot) => {
        try {
          const friendsData = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
              const friendId = docSnapshot.data().friendId;

              const userDoc = await getDoc(doc(db, "users", friendId));
              const userData = userDoc.exists() ? userDoc.data() : {};

              return {
                id: docSnapshot.id,
                friendId,
                friendName: userData?.displayName || "No username",
                friendEmail: userData?.email || "No email",
              } as Friend;
            })
          );
          setFriends(friendsData);
        } catch (error) {
          console.error("Failed to fetch friends:", error);
          setError("Failed to fetch friends.");
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  return { friends, loading, error };
};

export default useMyFriends;