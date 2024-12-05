import { useState } from "react";
import { getFirestore, query, collection, where, getDocs } from "firebase/firestore";

const useUserSearch = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = async (searchTerm: string, searchType: "email" | "username") => {
    const db = getFirestore();
    setLoading(true);
    setError(null);

    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where(searchType === "email" ? "email" : "displayName", "==", searchTerm)
      );
      const querySnapshot = await getDocs(q);

      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setSearchResults(users);
    } catch (error) {
      setError("Error searching for users.");
    } finally {
      setLoading(false);
    }
  };

  return { searchUsers, searchResults, loading, error };
};

export default useUserSearch;