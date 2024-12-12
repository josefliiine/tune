import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import { Question } from "../types/Questions";

interface UseMatchmakingResult {
  status: string;
  opponent: string | null;
  loading: boolean;
  gameId: string | null;
  quizQuestions: Question[];
}

const useMatchmaking = (
  userId: string | null,
  selectedDifficulty: string | null,
  gameMode: 'self' | 'random' | 'friend' | null
): UseMatchmakingResult => {
  const [status, setStatus] = useState<string>('idle');
  const [opponent, setOpponent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!userId || gameMode !== 'random' || !selectedDifficulty) return;

    setLoading(true);
    setStatus('waiting');

    const findMatch = async () => {
      try {
        const response = await api.post("/matchmaking", { userId, difficulty: selectedDifficulty });
        if (response.status === 200) {
          setStatus('matched');
          setOpponent(response.data.opponentId);
          setGameId(response.data.gameId);
          setQuizQuestions(response.data.quizQuestions);
        }
      } catch (error) {
        console.error("Error during matchmaking:", error);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    findMatch();
  }, [userId, selectedDifficulty, gameMode]);

  return { status, opponent, loading, gameId, quizQuestions };
};

export default useMatchmaking;