import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import useUserSearch from "../hooks/useUserSearch";
import { db } from "../services/firebase";
import useMyFriends from "../hooks/useMyFriends";

const UserSearch = () => {
  const { searchUsers, searchResults, loading, error } = useUserSearch();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<
    { friendId: string; displayName: string }[]
  >([]);

  const { friends: myFriends, loading: friendsLoading, error: friendsError } = useMyFriends(currentUserId);

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
    if (friendId === currentUserId) {
      console.warn("Cant add yourself as a friend.");
      return;
    }
    const friendDocId = `${currentUserId}_${friendId}`;
    try {
      // Add friend request in Firestore
      await setDoc(doc(collection(db, "friends"), friendDocId), {
        userId: currentUserId,
        friendId,
        status: "pending",
        timestamp: serverTimestamp(),
      });

      setFriendRequests((prev) => [...prev, { friendId, displayName }]);
      console.log("Friend request sent!");
    } catch (error) {
      console.error("Error with sending friend request:", error);
    }
  };

  const isAlreadyFriend = (userId: string): boolean => {
    return myFriends.some((friend) => friend.friendId === userId);
  };

  const isRequestSent = (userId: string): boolean => {
    return friendRequests.some((req) => req.friendId === userId);
  };

  const isSelf = (userId: string): boolean => {
    return userId === currentUserId;
  };

  return (
    <div className="friend-card">
      <form onSubmit={handleSearch} className="user-search-form">
        <input
          type="text"
          placeholder="Search for email or username"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={loading || friendsLoading}>
          {loading ? "Searching for user..." : "Search"}
        </button>
      </form>

      {(error || friendsError) && <div className="error-message">{error || friendsError}</div>}

      <ul className="search-results">
        {searchResults.map((user) => {
          const alreadyFriend = isAlreadyFriend(user.id);
          const requestSent = isRequestSent(user.id);
          const self = isSelf(user.id);

          let buttonText = "Add friend";
          let buttonDisabled = false;

          if (self) {
            buttonText = "It's you dummie";
            buttonDisabled = true;
          } else if (alreadyFriend) {
            buttonText = "Already friends";
            buttonDisabled = true;
          } else if (requestSent) {
            buttonText = "Friend request sent";
            buttonDisabled = true;
          }

          return (
            <li key={user.id} className="result-item">
              <span>
                <strong>{user.displayName ?? "Unknown"}</strong> - {user.email}
              </span>
              <button
                onClick={() => addFriend(user.id, user.displayName ?? "Unknown")}
                disabled={buttonDisabled}
              >
                {buttonText}
              </button>
            </li>
          );
        })}
      </ul>

      {friendRequests.length > 0 && (
        <div className="friend-requests">
          <h3>Sent friend requests</h3>
          <ul>
            {friendRequests.map((request) => (
              <li key={request.friendId}>
                {request.displayName} (Request pending)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserSearch;