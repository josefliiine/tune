import React, { useEffect, useState } from "react";
import socket from "../socket";
import Modal from "./Modal";
import api from "../api/axiosConfig";
import useAuth from "../hooks/useAuth.ts";
import { useNavigate } from "react-router-dom";
import { Question } from "../types/Questions";
import axios from "axios";

interface Challenge {
  challengeId: string;
  challengerId: string;
}

interface User {
  displayName?: string;
  email?: string;
}

interface ChallengeReceivedData {
  challengeId: string;
  challengerId: string;
}

interface StartGameData {
  gameId: string;
  quizQuestions: Question[];
  opponentId: string;
  gameMode: "self" | "random" | "friend";
}

const IncomingChallenges: React.FC = () => {
  const { userId } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengerInfo, setChallengerInfo] = useState<{ [key: string]: User }>({});
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    socket.emit("authenticate", { userId });
    console.log("Authenticate emitted from IncomingChallenges");

    const handleChallengeReceived = async (data: ChallengeReceivedData) => {
      console.log("Challenge received:", data);
      const { challengeId, challengerId } = data;

      setChallenges((prev) => {
        if (prev.find((c) => c.challengeId === challengeId)) {
          return prev;
        }
        return [...prev, { challengeId, challengerId }];
      });

      try {
        const response = await api.get<User>(`/users/${challengerId}`);
        if (response.status === 200) {
          const userData = response.data;
          setChallengerInfo((prev) => ({
            ...prev,
            [challengerId]: userData,
          }));
        }
      } catch (err: unknown) {
        console.error("Error fetching challenger info:", err);
        if (axios.isAxiosError(err)) {
          setError("Can't find information about the challenger.");
        } else {
          setError("An unexpected error occurred.");
        }
      }
    };

    const handleStartGame = (data: StartGameData) => {
      console.log("Start game received:", data);
      const { gameId, quizQuestions, opponentId, gameMode } = data;
      navigate("/difficulty-page", { state: { gameId, quizQuestions, opponentId, gameMode } });
    };

    socket.on("challengeReceived", handleChallengeReceived);
    socket.on("startGame", handleStartGame);

    return () => {
      socket.off("challengeReceived", handleChallengeReceived);
      socket.off("startGame", handleStartGame);
    };
  }, [userId, navigate]);

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
            <h2>New Challenge</h2>
            <p>
              {challenger?.displayName || "Unknown"} ({challenger?.email || "No e-mail"}) has challenged you to a game.
            </p>
            <button onClick={() => handleRespond(challenge.challengeId, "accept")}>Accept</button>
            <button onClick={() => handleRespond(challenge.challengeId, "decline")}>Decline</button>
          </Modal>
        );
      })}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default IncomingChallenges;
