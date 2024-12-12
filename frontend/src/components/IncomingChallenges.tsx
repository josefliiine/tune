import React, { useEffect, useState } from "react";
import socket from "../socket";
import Modal from "./Modal";
import api from "../api/axiosConfig";

interface Challenge {
  challengeId: string;
  challengerId: string;
}

interface User {
  displayName?: string;
  email?: string;
}

const IncomingChallenges: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengerInfo, setChallengerInfo] = useState<{ [key: string]: User }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleChallengeReceived = async (data: any) => {
      console.log("Challenge received:", data);
      const { challengeId, challengerId } = data;

      setChallenges((prev) => {
        if (prev.find((c) => c.challengeId === challengeId)) {
          return prev;
        }
        return [...prev, { challengeId, challengerId }];
      });

      try {
        const response = await api.get(`/users/${challengerId}`);
        if (response.status === 200) {
          const userData = response.data;
          setChallengerInfo((prev) => ({
            ...prev,
            [challengerId]: userData,
          }));
        }
      } catch (err) {
        console.error("Error fetching challenger info:", err);
        setError("Misslyckades med att hämta information om utmanaren.");
      }
    };

    socket.on("challengeReceived", handleChallengeReceived);

    return () => {
      socket.off("challengeReceived", handleChallengeReceived);
    };
  }, []);

  const handleRespond = (challengeId: string, response: "accept" | "decline") => {
    console.log(`Responding to challenge ${challengeId} with response ${response}`);
    socket.emit("respondToChallenge", { challengeId, response });
    setChallenges((prev) => prev.filter((c) => c.challengeId !== challengeId));
  };

  return (
    <div>
      {challenges.map((challenge) => {
        const challenger = challengerInfo[challenge.challengerId];
        return (
          <Modal key={challenge.challengeId} onClose={() => {}}>
            <h2>Ny Utmaning</h2>
            <p>
              {challenger?.displayName || "Okänd"} ({challenger?.email || "Ingen e-post"}) har utmanat dig till ett spel.
            </p>
            <button onClick={() => handleRespond(challenge.challengeId, "accept")}>Acceptera</button>
            <button onClick={() => handleRespond(challenge.challengeId, "decline")}>Avvisa</button>
          </Modal>
        );
      })}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default IncomingChallenges;