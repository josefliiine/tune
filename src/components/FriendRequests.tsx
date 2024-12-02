import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import useFriendRequests from "../hooks/useFriendRequests";

const FriendRequests = () => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
    useEffect(() => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        setCurrentUserId(user.uid);
      }
    }, []);
  
    const { requests, loading, error } = useFriendRequests(currentUserId);
  
    const handleAcceptFriendRequest = (friendId: string) => {
      console.log(`Friend request from ${friendId} accepted.`);
    };
  
    const handleRejectFriendRequest = (friendId: string) => {
      console.log(`Friend request from ${friendId} rejected.`);
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
      <div>
        <h2>Incoming Friend Requests</h2>
        <ul>
          {requests.map((request) => (
            <li key={request.id}>
              <p>
                {request.senderName} ({request.senderEmail}) sent you a friend request.
              </p>
              <button onClick={() => handleAcceptFriendRequest(request.friendId)}>Accept</button>
              <button onClick={() => handleRejectFriendRequest(request.friendId)}>Reject</button>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  export default FriendRequests;