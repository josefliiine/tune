import React, { useState, useEffect } from "react";
import useMyFriends from "../hooks/useMyFriends";
import useFriendGames from "../hooks/useFriendGames";
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
      <div className="friends-grid">
        {friends.map((friend) => (
          <FriendCard key={friend.friendId} friend={friend} onRemove={handleRemoveFriend} />
        ))}
      </div>
    </div>
  );
};

interface FriendCardProps {
  friend: {
    friendId: string;
    friendName: string;
    friendEmail: string;
  };
  onRemove: (friendId: string) => void;
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, onRemove }) => {
  const { games, loading, error } = useFriendGames(friend.friendId);

  const getResultStyle = (result: string) => {
    switch (result) {
      case "win":
        return { color: "green" };
      case "lose":
        return { color: "red" };
      case "draw":
        return { color: "gray" };
      case "completed":
        return { color: "blue" };
      default:
        return {};
    }
  };

  return (
    <div className="friend-card">
      <div className="friend-header">
        <div className="friend-info">
          <p className="friend-name">{friend.friendName}</p>
          <p className="friend-email">{friend.friendEmail}</p>
        </div>
        <div className="friend-actions">
          <FontAwesomeIcon
            icon={faTrash}
            className="icon-trash"
            onClick={() => onRemove(friend.friendId)}
            title="Remove friend"
          />
        </div>
      </div>
      <div className="friend-games">
        <h4>Latest games:</h4>
        {loading ? (
          <p>Loading games...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : games.length === 0 ? (
          <p>No latest games.</p>
        ) : (
          <ul className="games-list">
            {games.map((game) => (
              <li key={game.gameId} className="game-item">
                <strong>{mapGameMode(game.gameMode)}</strong> -{" "}
                <span style={getResultStyle(game.result)}>
                  {game.aborted ? "Aborted" : game.result}
                </span>{" "}
                - {new Date(game.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const mapGameMode = (mode: string) => {
  switch (mode) {
    case "self":
      return "Self";
    case "random":
      return "Random";
    case "friend":
      return "Friend";
    default:
      return mode;
  }
};

export default MyFriends;