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
      setSendError("Friend declined the challenge.");
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
      setSendError("Choose a friend to challenge.");
      return;
    }

    setSendError(null);
    setSuccessMessage(null);
    sendChallenge(selectedFriendId, difficulty);
    setSuccessMessage("Challenge sent successfully!");
  };

  return (
    <Modal onClose={onClose}>
      <div className="play-against-friend-modal">
        <h2 className="modal-title">Play against a friend</h2>
        {loading && <p className="modal-loading">Loading friends...</p>}
        {friendsError && <p className="modal-error">Error: {friendsError}</p>}
        {!loading && !friendsError && (
          <div className="modal-body">
            <label htmlFor="friend-select" className="modal-label">Choose a friend:</label>
            <select
              id="friend-select"
              className="modal-select"
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

            <button
              className="modal-send-button"
              onClick={handleSendChallenge}
              disabled={!selectedFriendId || challengeStatus === 'pending'}
            >
              {challengeStatus === 'pending' ? "Sending..." : "Send challenge"}
            </button>
            {sendError && <p className="modal-error">{sendError}</p>}
            {successMessage && <p className="modal-success">{successMessage}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PlayAgainstFriendModal;