import { useEffect, useState } from "react";
import socket from "../socket";
import { Question } from "../types/Questions";

interface MatchFoundData {
  gameId: string;
  quizQuestions: Question[];
  opponent: string;
}

interface MatchmakingErrorData {
  message: string;
}

const useMatchmaking = (
  userId: string | null,
  difficulty: string | null,
  gameMode: 'self' | 'random' | 'friend' | null
) => {
  const [status, setStatus] = useState<'waiting' | 'matched' | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (gameMode !== 'random') return;
    if (!userId || !difficulty) return;

    setLoading(true);
    setStatus(null);
    setOpponent(null);
    setGameId(null);
    setQuizQuestions([]);

    socket.emit("joinMatchmaking", { userId, difficulty });

    const onMatchFound = (data: MatchFoundData) => {
      console.log("Match found:", data);
      setStatus('matched');
      setOpponent(data.opponent);
      setGameId(data.gameId);
      setQuizQuestions(data.quizQuestions);
      setLoading(false);
    };

    const onWaitingForMatch = () => {
      console.log("Waiting for a match...");
      setStatus('waiting');
      setLoading(false);
    };

    const onError = (data: MatchmakingErrorData) => {
      console.error("Matchmaking error:", data.message);
      setLoading(false);
      setStatus(null);
    };

    socket.on("matchFound", onMatchFound);
    socket.on("waitingForMatch", onWaitingForMatch);
    socket.on("error", onError);

    return () => {
      socket.off("matchFound", onMatchFound);
      socket.off("waitingForMatch", onWaitingForMatch);
      socket.off("error", onError);
    };
  }, [userId, difficulty, gameMode]);

  return { status, opponent, loading, gameId, quizQuestions };
};

export default useMatchmaking;