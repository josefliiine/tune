import { useState, useEffect } from "react";
import Header from "../components/Header.tsx";
import useMatchmaking from "../hooks/useMatchMaking.ts";
import { getFirestore, query, collection, where, getDocs, doc, setDoc } from "firebase/firestore";
import QuizComponent from "../components/QuizComponent.tsx";
import { Question } from "../types/Questions.ts";

const DifficultyPage = ({ userId }: { userId: string }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'self' | 'random' | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const { status, opponent, loading: matchmakingLoading } = useMatchmaking(userId);

  const db = getFirestore();

  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
  };

  const fetchQuestions = async (difficulty: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/questions?difficulty=${difficulty}`);
      if (!response.ok) {
        throw new Error('Något gick fel med att hämta frågorna.');
      }
      const questions: Question[] = await response.json();
      return questions;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const tryFindGame = async (attempt = 1) => {
    if (!opponent) return;

    console.log("Trying to find game for players:", userId, opponent);
    const q = query(
      collection(db, "games"),
      where("player1", "in", [userId, opponent]),
      where("player2", "in", [userId, opponent]),
      where("status", "==", "started"),
      where("currentQuestionIndex", "==", 0)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const foundGameId = querySnapshot.docs[0].id;
      console.log("Game found:", foundGameId);
      setGameId(foundGameId);
      setIsGameReady(true);
    } else {
      const delay = Math.min(1000 * 2 ** attempt, 30000); // Max 30 sekunder
      console.log(`No game found yet for these players. Retrying in ${delay / 1000}s...`);
      setTimeout(() => {
        tryFindGame(attempt + 1);
      }, delay);
    }
  };

  const handleGameModeChange = async (mode: 'self' | 'random') => {
    setGameMode(mode);
    const questions = await fetchQuestions(selectedDifficulty || "");
    const totalQuestions = 10;
    console.log("Fetched questions:", questions.length);
    setQuizQuestions(questions.slice(0, totalQuestions));

    if (mode === "self") {
      const newGameId = `self-${userId}-${Date.now()}`;
      const gameRef = doc(db, "games", newGameId);
      await setDoc(gameRef, {
        player1: userId,
        player2: userId,
        status: "started",
        createdAt: new Date(),
        player1Answered: false,
        player2Answered: false,
        currentQuestionIndex: 0,
        questions: []
      });

      setGameId(newGameId);
      setIsGameReady(true);
    } else if (mode === "random") {
      if (status === 'matched' && opponent) {
        await tryFindGame();
      }
    }
  };

  useEffect(() => {
    if (gameMode === 'random' && status === 'matched' && selectedDifficulty && opponent && !isGameReady && !gameId) {
      console.log("Matched found, trying to get gameId...");
      tryFindGame();
    }
  }, [gameMode, status, selectedDifficulty, opponent, userId, db, gameId, isGameReady]);

  if (isGameReady && gameId) {
    return (
      <div className="quiz-page">
        <Header />
        <QuizComponent
          gameId={gameId}
          userId={userId}
          opponent={opponent}
          gameMode={gameMode}
          quizQuestions={quizQuestions}
        />
      </div>
    );
  }

  return (
    <div className="difficulty-page">
      <Header />
      <main className="main-content">
        {!selectedDifficulty ? (
          <>
            <h1>Choose Difficulty</h1>
            <div className="difficulty-buttons">
              <button onClick={() => handleDifficultySelect("Easy")}>Easy</button>
              <button onClick={() => handleDifficultySelect("Intermediate")}>Intermediate</button>
              <button onClick={() => handleDifficultySelect("Hard")}>Hard</button>
            </div>
          </>
        ) : (
          <>
            <h1>Choose Game Mode</h1>
            <div className="game-mode-buttons">
              <button onClick={() => handleGameModeChange("self")}>Play Against Yourself</button>
              <button onClick={() => handleGameModeChange("random")}>Play Against Random User</button>
            </div>

            {gameMode === "random" && (
              <div>
                {matchmakingLoading ? (
                  <p>Looking for a match...</p>
                ) : status === "matched" ? (
                  <p>Matched with user: {opponent}</p>
                ) : (
                  <p>Waiting for a match...</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DifficultyPage;