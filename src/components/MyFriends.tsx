import useMyFriends from "../hooks/useMyFriends";
import { auth } from "../services/firebase";
import { useState, useEffect } from "react";

const MyFriends = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, []);

  const { friends, loading, error } = useMyFriends(currentUserId);

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
          <li key={friend.id}>
            <p>Username: {friend.friendName}</p>
            <p>Email: {friend.friendEmail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyFriends;