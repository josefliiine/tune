import { useState, useEffect } from "react";
import Header from "../../components/Header";
import QuizComponent from "../../components/QuizComponent";
import { Question } from "../../types/Questions";
import api from '../../api/axiosConfig';
import { getIdToken } from "../../utils/getIdToken";
import axios from 'axios';

const DifficultyPage = ({ userId }: { userId: string }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'self' | 'random' | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [matchmakingLoading, setMatchmakingLoading] = useState<boolean>(false);
  
  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
  };

  const fetchQuestions = async (difficulty: string) => {
    try {
      const response = await api.get('/questions', {
        params: { difficulty },
        headers: {
          'Authorization': `Bearer ${await getIdToken()}`
        }
      });
      return response.data as Question[];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching questions:', error.response?.data);
      } else {
        console.error('Error fetching questions:', error);
      }
      return [];
    }
  };

  const createSelfGame = async () => {
    try {
      const response = await api.post('/games', {
        gameMode: 'self',
        userId,
        difficulty: selectedDifficulty,
      }, {
        headers: {
          'Authorization': `Bearer ${await getIdToken()}`
        }
      });
      setGameId(response.data.gameId);
      setQuizQuestions(response.data.quizQuestions);
      setIsGameReady(true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error creating self game:', error.response?.data);
      } else {
        console.error('Error creating self game:', error);
      }
    }
  };

  const joinRandomGame = async () => {
    setMatchmakingLoading(true);
    try {
      const response = await api.post('/match/join', {
        userId,
        difficulty: selectedDifficulty,
      }, {
        headers: {
          'Authorization': `Bearer ${await getIdToken()}`
        }
      });
      if (response.data.gameId) {
        setGameId(response.data.gameId);
        setQuizQuestions(response.data.quizQuestions);
        setIsGameReady(true);
      } else {
        setOpponent(response.data.opponent);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error joining random game:', error.response?.data);
      } else {
        console.error('Error joining random game:', error);
      }
    } finally {
      setMatchmakingLoading(false);
    }
  };

  const handleGameModeChange = async (mode: 'self' | 'random') => {
    setGameMode(mode);
    const questions = await fetchQuestions(selectedDifficulty || "");
    const totalQuestions = 10;
    setQuizQuestions(questions.slice(0, totalQuestions));

    if (mode === "self") {
      await createSelfGame();
    } else if (mode === "random") {
      await joinRandomGame();
    }
  };

  useEffect(() => {
  }, [gameMode, isGameReady]);

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
                ) : opponent ? (
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