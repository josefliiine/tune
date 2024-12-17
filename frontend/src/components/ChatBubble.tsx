import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

interface Friend {
  friendId: string;
  friendName: string;
}

const ChatBubble: React.FC<{ currentUserId: string; friends: Friend[] }> = ({
  currentUserId,
  friends,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch messages from Firestore
  useEffect(() => {
    if (!selectedFriend) return;

    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("senderId", "in", [currentUserId, selectedFriend.friendId]),
      where("receiverId", "in", [currentUserId, selectedFriend.friendId]),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: ChatMessage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [currentUserId, selectedFriend]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      await addDoc(collection(db, "messages"), {
        senderId: currentUserId,
        receiverId: selectedFriend.friendId,
        text: newMessage,
        timestamp: Date.now(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
      <button onClick={() => setOpen((prev) => !prev)} className="chat-toggle">
        <FontAwesomeIcon icon={faComments} />
        </button>
      {open && (
        <div className="chat-container">
          <div className="chat-header">
            <h3>Chat</h3>
            <button onClick={() => setOpen(false)}>✖</button>
          </div>
          <div className="friends-list">
            <h4>Your Friends:</h4>
            <ul>
              {friends.map((friend) => (
                <li key={friend.friendId} onClick={() => setSelectedFriend(friend)}>
                  {friend.friendName}
                </li>
              ))}
            </ul>
          </div>
          {selectedFriend && (
            <div className="chat-box">
              <h4>Chat with {selectedFriend.friendName}</h4>
              <div className="messages">
                {messages.map((msg) => (
                  <p
                    key={msg.id}
                    style={{
                      textAlign:
                        msg.senderId === currentUserId ? "right" : "left",
                    }}
                  >
                    {msg.text}
                  </p>
                ))}
              </div>
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBubble;