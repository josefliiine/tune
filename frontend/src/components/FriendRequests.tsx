import { useEffect, useState } from "react";
import useFriendRequests from "../hooks/useFriendRequests";
import { auth } from "../services/firebase";

const FriendRequests = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, []);

  const { requests, loading, error, acceptFriendRequest, rejectFriendRequest } =
    useFriendRequests(currentUserId);

  const handleAcceptFriendRequest = async (
    requestId: string,
    userId: string,
    friendId: string
  ) => {
    try {
      await acceptFriendRequest(requestId, userId, friendId);
      console.log(`Friend request from ${friendId} accepted.`);
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      console.log(`Friend request from ${requestId} rejected.`);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  if (loading) {
    return <p>Loading friend requests...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (requests.length === 0) {
    return <p>No incoming friend requests.</p>;
  }

  return (
    <div className="friend-card">
      <ul className="friend-requests-list">
        {requests.map((request) => (
          <li key={request.id} className="friend-request-item">
            <p>
              {request.senderName} ({request.senderEmail}) sent you a friend
              request.
            </p>
            <div className="friend-request-buttons">
              <button
                className="accept-button"
                onClick={() =>
                  handleAcceptFriendRequest(
                    request.id,
                    request.userId,
                    request.friendId
                  )
                }
              >
                Accept
              </button>
              <button
                className="reject-button"
                onClick={() => handleRejectFriendRequest(request.id)}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FriendRequests;