import { useState, useEffect } from "react";
import { collection, onSnapshot, where, Timestamp, query, getDoc, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";

interface FriendRequest {
  id: string;
  userId: string;
  friendId: string;
  status: "pending" | "accepted" | "rejected";
  timestamp: Timestamp;
  senderName?: string;
  senderEmail?: string;
}

const useFriendRequests = (currentUserId: string | null) => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const acceptFriendRequest = async (requestId: string, userId: string, friendId: string) => {
    try {
      await updateDoc(doc(db, "friends", requestId), { status: "accepted" });

      const friendsListCollection = collection(db, "friendsList");

      // Add both users in eachothers friends list
      await Promise.all([
        addDoc(friendsListCollection, { userId, friendId }),
        addDoc(friendsListCollection, { userId: friendId, friendId: userId }),
      ]);

      console.log(`Vänförfrågan mellan ${userId} och ${friendId} har accepterats.`);

      setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error("Misslyckades med att acceptera vänförfrågan:", error);
      throw error;
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, "friends", requestId));
      console.log(`Vänförfrågan ${requestId} har avslagats.`);

      setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error("Failed to reject friend request:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (!currentUserId) return;

    const friendRequestQuery = query(
      collection(db, "friends"),
      where("friendId", "==", currentUserId),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      friendRequestQuery,
      async (snapshot) => {
        try {
          const requestsWithUserInfo = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
              const data = docSnapshot.data();
              const userDoc = await getDoc(doc(db, "users", data.userId));
              const userData = userDoc.exists() ? userDoc.data() : null;

              return {
                id: docSnapshot.id,
                userId: data.userId,
                friendId: data.friendId,
                status: data.status,
                timestamp: data.timestamp,
                senderName: userData?.displayName || "Unknown user",
                senderEmail: userData?.email || "No email provided",
              } as FriendRequest;
            })
          );
          setRequests(requestsWithUserInfo);
        } catch (error) {
          console.error("Error fetching friend requests with user data:", error);
          setError("Failed to fetch friend requests.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Something went wrong when fetching friend requests:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  return { requests, loading, error, acceptFriendRequest, rejectFriendRequest };
};

export default useFriendRequests;