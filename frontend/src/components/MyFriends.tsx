import React, { useState, useEffect } from "react";
import useMyFriends from "../hooks/useMyFriends";
import useFriendGames from "../hooks/useFriendGames";
import { auth } from "../services/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Modal from "./Modal";

interface Friend {
  friendId: string;
  friendName: string;
  friendEmail: string;
}

interface FriendToRemove {
  id: string;
  name: string;
}

const MyFriends: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<FriendToRemove | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, []);

  const { friends, loading, error, removeFriend } = useMyFriends(currentUserId);

  const handleRemoveClick = (friendId: string, friendName: string) => {
    setFriendToRemove({ id: friendId, name: friendName });
    setIsModalOpen(true);
    setRemoveError(null);
  };

  const handleConfirmRemove = async () => {
    if (!friendToRemove) return;

    try {
      await removeFriend(friendToRemove.id);
      console.log(`Friend with ID ${friendToRemove.id} has been removed.`);
      setIsModalOpen(false);
      setFriendToRemove(null);
      setRemoveError(null);
    } catch (error: unknown) {
      console.error("Error removing friend:", error);
      if (error instanceof Error) {
        setRemoveError(`Det gick inte att ta bort ${friendToRemove.name}. Fel: ${error.message}`);
      } else {
        setRemoveError("Det gick inte att ta bort vännen. Försök igen senare.");
      }
    }
  };

  const handleCancelRemove = () => {
    setIsModalOpen(false);
    setFriendToRemove(null);
    setRemoveError(null);
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
    <div className="my-friends-container">
      <div className="friends-grid">
        {friends.map((friend) => (
          <FriendCard
            key={friend.friendId}
            friend={friend}
            onRemove={handleRemoveClick}
          />
        ))}
      </div>

      {isModalOpen && friendToRemove && (
        <Modal onClose={handleCancelRemove}>
          <h2>Remove friend</h2>
          <p>Are you sure you want to remove <strong>{friendToRemove.name}</strong>?</p>
          
          {removeError && <p className="error-message">{removeError}</p>}

          <div className="modal-buttons">
            <button onClick={handleConfirmRemove} className="confirm-button">
              Confirm
            </button>
            <button onClick={handleCancelRemove} className="cancel-button">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

interface FriendCardProps {
  friend: Friend;
  onRemove: (friendId: string, friendName: string) => void;
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
        return { color: "orange" };
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
            onClick={() => onRemove(friend.friendId, friend.friendName)}
            title="Remove friend"
          />
        </div>
      </div>
      <div className="friend-games">
        <h3>Latest games:</h3>
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