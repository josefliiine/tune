import { useState, useEffect } from "react";
import api from "../api/axiosConfig";
import { getIdToken } from "../utils/getIdToken";

interface GameResult {
    gameId: string;
    gameMode: 'self' | 'random' | 'friend';
    correctAnswers: number | null;
    result: string;
    createdAt: string;
}

const useFriendGames = (friendId: string) => {
    const [games, setGames] = useState<GameResult[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFriendGames = async () => {
            try {
                const token = await getIdToken();
                const response = await api.get<GameResult[]>(`/games/friends/${friendId}/games`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setGames(response.data);
                setLoading(false);
            } catch (err: any) {
                console.error("Error fetching friend's games:", err);
                setError("Failed to fetch friend's game result.");
                setLoading(false);
            }
        };

        if (friendId) {
            fetchFriendGames();
        }
    }, [friendId]);

    return { games, loading, error };
};

export default useFriendGames;