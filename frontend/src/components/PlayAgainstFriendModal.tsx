import React, { useState, useEffect } from "react";
import useMyFriends from "../hooks/useMyFriends";
import Modal from "./Modal";
import useFriendChallenge from "../hooks/useFriendChallenge";

interface PlayAgainstFriendModalProps {
  userId: string;
  onClose: () => void;
  difficulty: string;
}

const PlayAgainstFriendModal: React.FC<PlayAgainstFriendModalProps> = ({ userId, onClose, difficulty }) => {
  console.log("PlayAgainstFriendModal received difficulty:", difficulty);

  const { friends, loading, error: friendsError } = useMyFriends(userId);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { challengeStatus, sendChallenge, gameData, error: challengeError } = useFriendChallenge(userId);

  useEffect(() => {
    if (challengeStatus === 'accepted' && gameData) {
      onClose();
    } else if (challengeStatus === 'declined') {
      setSendError("Your friend declined the challenge.");
    }
  }, [challengeStatus, gameData, onClose]);

  useEffect(() => {
    if (challengeError) {
      setSendError(challengeError);
    }
  }, [challengeError]);

  const handleSendChallenge = () => {
    console.log("Sending challenge with difficulty:", difficulty);
    if (!selectedFriendId) {
      setSendError("Please select a friend to challenge.");
      return;
    }

    setSendError(null);
    setSuccessMessage(null);
    sendChallenge(selectedFriendId, difficulty);
    setSuccessMessage("Challenge sent successfully!");
  };

  return (
    <Modal onClose={onClose}>
      <h2>Play Against a Friend</h2>
      {loading && <p>Loading friends...</p>}
      {friendsError && <p>Error: {friendsError}</p>}
      {!loading && !friendsError && (
        <div>
          <label htmlFor="friend-select">Select a friend:</label>
          <select
            id="friend-select"
            value={selectedFriendId}
            onChange={(e) => setSelectedFriendId(e.target.value)}
          >
            <option value="">--Choose a friend--</option>
            {friends.map((friend) => (
              <option key={friend.friendId} value={friend.friendId}>
                {friend.friendName} ({friend.friendEmail})
              </option>
            ))}
          </select>

          <button onClick={handleSendChallenge} disabled={!selectedFriendId || challengeStatus === 'pending'}>
            {challengeStatus === 'pending' ? "Sending..." : "Send Challenge"}
          </button>
          {sendError && <p style={{ color: "red" }}>{sendError}</p>}
          {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        </div>
      )}
      <button onClick={onClose} style={{ marginTop: "10px" }}>Close</button>
    </Modal>
  );
};

export default PlayAgainstFriendModal;