import React, { useState } from "react";
import useMyFriends from "../hooks/useMyFriends";
import Modal from "./Modal";
import socket from "../socket";

interface PlayAgainstFriendModalProps {
  userId: string;
  onClose: () => void;
}

const PlayAgainstFriendModal: React.FC<PlayAgainstFriendModalProps> = ({ userId, onClose }) => {
  const { friends, loading, error } = useMyFriends(userId);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSendChallenge = async () => {
    if (!selectedFriendId) {
      setSendError("Please select a friend to challenge.");
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      socket.emit("challengeFriend", { challengerId: userId, challengedId: selectedFriendId });
      setSuccessMessage("Challenge sent successfully!");
    } catch (err) {
      console.error("Error sending challenge:", err);
      setSendError("Failed to send challenge.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2>Play Against a Friend</h2>
      {loading && <p>Loading friends...</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && (
        <div>
          <label htmlFor="friend-select">Select a friend:</label>
          <select
            id="friend-select"
            value={selectedFriendId}
            onChange={(e) => setSelectedFriendId(e.target.value)}
          >
            <option value="">--Choose a friend--</option>
            {friends.map((friend) => (
              <option key={friend.id} value={friend.friendId}>
                {friend.friendName} ({friend.friendEmail})
              </option>
            ))}
          </select>
          <button onClick={handleSendChallenge} disabled={sending || !selectedFriendId}>
            {sending ? "Sending..." : "Send Challenge"}
          </button>
          {sendError && <p style={{ color: "red" }}>{sendError}</p>}
          {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        </div>
      )}
    </Modal>
  );
};

export default PlayAgainstFriendModal;