import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { Question } from "../types/Questions";

const useQuestionsByDifficulty = (difficulty: string) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            setError(null);

            try {
                const q = query(
                    collection(db, "questions"),
                    where("difficulty", "==", difficulty)
                );

                const querySnapshot = await getDocs(q);
                const fetchedQuestions: Question[] = querySnapshot.docs.map((doc) => {
                    return doc.data() as Question;
                });

                setQuestions(fetchedQuestions);
            } catch (error) {
                setError("Failed to fetch questions.")
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        fetchQuestions();
    }, [difficulty]);

    return { questions, loading, error };
}

export default useQuestionsByDifficulty;