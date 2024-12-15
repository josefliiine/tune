import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { getIdToken } from "../../utils/getIdToken";
import useAuth from "../../hooks/useAuth";
import Header from "../../components/Header";
import Modal from "../../components/Modal";

interface Statistic {
    gameMode: 'self' | 'random' | 'friend';
    correctAnswers: number;
    result: string;
    createdAt: string;
}

const MyStatisticsPage: React.FC = () => {
    const { userId } = useAuth();
    const [statistics, setStatistics] = useState<Statistic[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatistics = async () => {
            if (!userId) {
                setError("User is not logged in.");
                setLoading(false);
                return;
            }

            try {
                const token = await getIdToken();
                const response = await api.get('/users/statistics', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setStatistics(response.data);
                setLoading(false);
            } catch (err: any) {
                console.error("Error fetching statistics:", err);
                if (err.response && err.response.status === 404) {
                    setError("Could not fins statistics.");
                } else {
                    setError("Failed to load statistics.");
                }
                setLoading(false);
            }
        };

        fetchStatistics();
    }, [userId]);

    const mapGameMode = (mode: string) => {
        switch(mode) {
            case 'self': return 'Self';
            case 'random': return 'Random';
            case 'friend': return 'Friend';
            default: return mode;
        }
    };

    if (loading) {
        return (
            <div>
                <Header />
                <p>Loading statistics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Header />
                <Modal onClose={() => setError(null)}>
                    <p>{error}</p>
                </Modal>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <main className="main-content">
                <h1>My Statistics</h1>
                {statistics.length === 0 ? (
                    <p>You haven't played any games yet.</p>
                ) : (
                    <table className="statistics-table">
                        <thead>
                            <tr>
                                <th>Gametype</th>
                                <th>Right answers</th>
                                <th>Result</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statistics.map((stat, index) => (
                                <tr key={index}>
                                    <td>{mapGameMode(stat.gameMode)}</td>
                                    <td>{stat.correctAnswers}</td>
                                    <td>{stat.result}</td>
                                    <td>{new Date(stat.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>
        </div>
    );
};

export default MyStatisticsPage;