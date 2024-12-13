import { useEffect, useState, useCallback } from "react";
import socket from "../socket";
import { Question } from "../types/Questions";

interface ChallengeResponse {
  challengeId: string;
  response: 'accept' | 'decline';
}

interface GameData {
  gameId: string;
  quizQuestions: Question[];
  opponent: string;
  gameMode: "friend";
}

interface UseFriendChallengeReturn {
  challengeStatus: 'pending' | 'accepted' | 'declined' | null;
  sendChallenge: (challengedId: string, difficulty: string) => void;
  gameData: GameData | null;
  error: string | null;
}

const useFriendChallenge = (challengerId: string): UseFriendChallengeReturn => {
  const [challengeStatus, setChallengeStatus] = useState<'pending' | 'accepted' | 'declined' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);

  useEffect(() => {
    const handleChallengeResponse = (data: ChallengeResponse) => {
      if (data.challengeId) {
        if (data.response === 'accept') {
          setChallengeStatus('accepted');
        } else if (data.response === 'decline') {
          setChallengeStatus('declined');
        }
      }
    };

    const handleStartGame = (data: GameData) => {
      setGameData(data);
      setChallengeStatus('accepted');
    };

    const handleError = (data: any) => {
      console.error("Friend challenge error:", data.message);
      setError(data.message);
      setChallengeStatus(null);
    };

    socket.on("challengeResponse", handleChallengeResponse);
    socket.on("startGame", handleStartGame);
    socket.on("error", handleError);

    return () => {
      socket.off("challengeResponse", handleChallengeResponse);
      socket.off("startGame", handleStartGame);
      socket.off("error", handleError);
    };
  }, []);

  const sendChallenge = useCallback((challengedId: string, difficulty: string) => {
    if (challengedId && difficulty) {
      console.log("Sending challenge with:", { challengerId, challengedId, difficulty });
      socket.emit("challengeFriend", { challengerId, challengedId, difficulty });
      setChallengeStatus('pending');
    } else {
      console.error("challengedId and difficulty must be set.");
      setError("Friend ID and difficulty are required to send a challenge.");
    }
  }, [challengerId]);

  return { challengeStatus, sendChallenge, gameData, error };
};

export default useFriendChallenge;