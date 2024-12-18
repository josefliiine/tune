import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { getIdToken } from "../../utils/getIdToken";
import useAuth from "../../hooks/useAuth";
import Header from "../../components/Header";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import axios, { AxiosError } from "axios";

interface Statistic {
    gameMode: 'self' | 'random' | 'friend';
    correctAnswers: number;
    createdAt: string;
}

const MyStatisticsPage: React.FC = () => {
    const { userId } = useAuth();
    const [statistics, setStatistics] = useState<Statistic[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchStatistics = async () => {
            if (!userId) {
                toast.error("User is not logged in.");
                setLoading(false);
                return;
            }

            try {
                const token = await getIdToken();
                const response = await api.get<Statistic[]>('/users/statistics', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setStatistics(response.data);
                setLoading(false);
            } catch (err: unknown) {
                setLoading(false);
                if (axios.isAxiosError(err)) {
                    const axiosError = err as AxiosError;
                    console.error("Error fetching statistics:", axiosError);
                    if (axiosError.response && axiosError.response.status === 404) {
                        toast.error("Could not find statistics.");
                    } else {
                        toast.error("Failed to load statistics.");
                    }
                } else {
                    console.error("Unexpected error:", err);
                    toast.error("An unexpected error occurred.");
                }
            }
        };

        fetchStatistics();
    }, [userId]);

    const mapGameMode = (mode: string): string => {
        switch(mode) {
            case 'self': return 'Self';
            case 'random': return 'Random';
            case 'friend': return 'Friend';
            default: return mode;
        }
    };

    if (loading) {
        return (
            <motion.div
                className="start-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Header />
                <motion.p
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    Loading statistics...
                </motion.p>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="start-page"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
        >
            <Header />
            <main className="main-content">
                <h1>My Statistics</h1>
                {statistics.length === 0 ? (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        You haven't played any games yet.
                    </motion.p>
                ) : (
                    <motion.table
                        className="statistics-table"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <thead>
                            <tr>
                                <th>Gametype</th>
                                <th>Right answers</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statistics.map((stat, index) => (
                                <motion.tr
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02, backgroundColor: "#fff" }}
                                >
                                    <td>{mapGameMode(stat.gameMode)}</td>
                                    <td>{stat.correctAnswers}</td>
                                    <td>{new Date(stat.createdAt).toLocaleString()}</td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </motion.table>
                )}
            </main>
        </motion.div>
    );
};

export default MyStatisticsPage;