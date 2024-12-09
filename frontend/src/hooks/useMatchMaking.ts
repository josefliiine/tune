import { useState, useEffect } from "react";
import axios from 'axios';
import { getIdToken } from "../utils/getIdToken";

const useMatchmaking = (userId: string) => {
  const [status, setStatus] = useState<'waiting' | 'matched' | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkMatchStatus = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/match/status`, {
          headers: {
            'Authorization': `Bearer ${await getIdToken()}`
          },
          params: { userId }
        });
        setStatus(response.data.status);
        setOpponent(response.data.opponent || null);
      } catch (error) {
        console.error('Error checking match status:', error);
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(() => {
      checkMatchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  return { status, opponent, loading };
};

export default useMatchmaking;