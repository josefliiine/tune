import { useState, useEffect } from 'react';

interface User {
  email: string;
}

const useRandomUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getRandomUser = async () => {
      try {
        const response = await fetch("http://localhost:3000/random-user");
        if (response.ok) {
          const data: User = await response.json();
          setUser(data);
        } else {
          setError('Failed to fetch random user');
        }
      } catch (error) {
        setError('Error fetching random user');
      } finally {
        setLoading(false);
      }
    };

    getRandomUser();
  }, []);

  return { user, loading, error };
};

export default useRandomUser;