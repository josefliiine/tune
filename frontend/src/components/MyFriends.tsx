import { useState, useEffect } from "react";
import useMyFriends from "../hooks/useMyFriends";
import { auth } from "../services/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

const MyFriends = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, []);

  const { friends, loading, error, removeFriend } = useMyFriends(currentUserId);

  const handleRemoveFriend = async (friendId: string) => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      try {
        await removeFriend(friendId);
        console.log(`Friend with ID ${friendId} has been removed.`);
      } catch (error) {
        console.error("Error removing friend:", error);
      }
    }
  };

  if (loading) {
    return <p>Loading friends...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (friends.length === 0) {
    return <p>You have no friends yet.</p>;
  }

  return (
    <div>
      <h2>My Friends</h2>
      <ul>
        {friends.map((friend) => (
          <li key={friend.id} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ flexGrow: 1 }}>
              <p style={{ margin: 0, fontWeight: "bold" }}>{friend.friendName}</p>
              <p style={{ margin: 0 }}>{friend.friendEmail}</p>
            </div>
            <FontAwesomeIcon
              icon={faTrash}
              style={{ cursor: "pointer", color: "black", marginLeft: "10px" }}
              onClick={() => handleRemoveFriend(friend.friendId)}
              title="Remove Friend"
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyFriends;