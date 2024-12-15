import { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import { getIdToken } from "../utils/getIdToken";

interface Player {
  id: string;
  name: string;
  score: number | null;
}

interface LatestGame {
  gameId: string;
  gameMode: 'self' | 'random' | 'friend';
  player1: Player;
  player2: Player | null;
  result: 'win' | 'lose' | 'draw' | 'completed';
  createdAt: string;
}

const useLatestGames = () => {
  const [latestGames, setLatestGames] = useState<LatestGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestGames = async () => {
      try {
        const token = await getIdToken();
        const response = await api.get<LatestGame[]>('/games/latest', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLatestGames(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching latest games:", err);
        setError("Couldn't fetch latest games.");
        setLoading(false);
      }
    };

    fetchLatestGames();
  }, []);

  return { latestGames, loading, error };
};

export default useLatestGames;