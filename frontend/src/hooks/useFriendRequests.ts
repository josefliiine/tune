import { useState, useEffect } from "react";
import { collection, onSnapshot, where, Timestamp, query, getDoc, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { toast } from "react-toastify";

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

      await Promise.all([
        addDoc(friendsListCollection, { userId, friendId }),
        addDoc(friendsListCollection, { userId: friendId, friendId: userId }),
      ]);

      setRequests((prevRequests) => prevRequests.filter((request) => request.id !== requestId));

      toast.success("Friend request accepted!");
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      toast.error("Failed to accept the friend request.");
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, "friends", requestId));
      setRequests((prevRequests) => prevRequests.filter((request) => request.id !== requestId));

      toast.info("Friend request rejected.");
    } catch (error) {
      console.error("Failed to reject friend request:", error);
      toast.error("Failed to reject the friend request.");
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
          const newRequests = snapshot.docChanges().filter((change) => change.type === "added");

          if (newRequests.length > 0) {
            newRequests.forEach(async (change) => {
              const data = change.doc.data();
              const userDoc = await getDoc(doc(db, "users", data.userId));
              const userData = userDoc.exists() ? userDoc.data() : null;
              const senderName = userData?.displayName || "Unknown user";

              toast.info(`${senderName} has sent you a friend request!`);
            });
          }

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