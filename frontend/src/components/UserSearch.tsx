import { useState, useEffect } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import useUserSearch from "../hooks/useUserSearch";
import { db } from "../services/firebase";

const UserSearch = () => {
  const { searchUsers, searchResults, loading, error } = useUserSearch();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<
    { friendId: string; displayName: string }[]
  >([]);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchType = searchTerm.includes("@") ? "email" : "username";
    searchUsers(searchTerm, searchType);
  };

  const addFriend = async (friendId: string, displayName: string) => {
    if (!currentUserId) return;
    const friendDocId = `${currentUserId}_${friendId}`;
    try {
      // Add friend request to Firestore
      await setDoc(doc(collection(db, "friends"), friendDocId), {
        userId: currentUserId,
        friendId,
        status: "pending",
        timestamp: serverTimestamp(),
      });

      setFriendRequests((prev) => [...prev, { friendId, displayName }]);
      console.log("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by email or username"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching for user..." : "Search"}
        </button>
      </form>

      {error && <div>{error}</div>}

      <ul>
        {searchResults.map((user) => (
          <li key={user.id}>
            {user.displayName ?? "Unknown"} - {user.email}
            <button
              onClick={() => addFriend(user.id, user.displayName ?? "Unknown")}
              disabled={friendRequests.some((req) => req.friendId === user.id)}
            >
              {friendRequests.some((req) => req.friendId === user.id)
                ? "Request Sent"
                : "Add Friend"}
            </button>
          </li>
        ))}
      </ul>

      {friendRequests.length > 0 && (
        <div>
          <h3>Friend Requests Sent</h3>
          <ul>
            {friendRequests.map((request) => (
              <li key={request.friendId}>
                {request.displayName} (Friend request pending)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserSearch;