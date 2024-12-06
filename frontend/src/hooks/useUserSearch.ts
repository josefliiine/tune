import { useState } from "react";
import { getFirestore, query, collection, where, getDocs } from "firebase/firestore";

interface User {
  id: string;
  email?: string;
  displayName?: string;
}

const useUserSearch = () => {
  const [searchResults, setSearchResults] = useState<User[]>([]);
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

      const users: User[] = querySnapshot.docs.map((doc) => {
        const data = doc.data() as Omit<User, "id">;
        return {
          id: doc.id,
          ...data,
        };
      });

      setSearchResults(users);
    } catch (e) {
      console.error(e);
      setError("Error searching for users.");
    } finally {
      setLoading(false);
    }
  };

  return { searchUsers, searchResults, loading, error };
};

export default useUserSearch;