import { useState, useEffect } from "react";
import { getFirestore, doc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore";

const useMatchmaking = (userId: string) => {
  const [status, setStatus] = useState<"waiting" | "matched" | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const db = getFirestore();
    const userRef = doc(db, "waitingList", userId);

    const startMatchmaking = async () => {
      setLoading(true);
      try {
        // Add user to waitinglist
        await setDoc(userRef, { status: "waiting" });
      } catch (error) {
        console.error("Error adding user to waiting list:", error);
      } finally {
        setLoading(false);
      }
    };

    startMatchmaking();

    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      const data = docSnapshot.data();
      if (data?.status === "matched") {
        setStatus("matched");
        setOpponent(data.opponent);
      } else {
        setStatus("waiting");
      }
    });

    return () => {
      unsubscribe();
      deleteDoc(userRef).catch((error) =>
        console.error("Error removing user from waiting list:", error)
      );
    };
  }, [userId]);

  return { status, opponent, loading };
};

export default useMatchmaking;