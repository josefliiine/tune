import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "../../components/Header";
import QuizComponent from "../../components/QuizComponent";
import Modal from "../../components/Modal";
import { Question } from "../../types/Questions";
import socket from "../../socket";
import api from "../../api/axiosConfig";
import { getIdToken } from "../../utils/getIdToken";
import useMatchmaking from "../../hooks/useMatchMaking";
import PlayAgainstFriendModal from "../../components/PlayAgainstFriendModal";
import useAuth from "../../hooks/useAuth.ts";

interface LocationState {
  gameId: string;
  quizQuestions: Question[];
  opponentId: string;
  gameMode: "self" | "random" | "friend";
}

interface StartGameData {
  gameId: string;
  quizQuestions: Question[];
  opponentId: string;
  gameMode: "self" | "random" | "friend";
}

const DifficultyPage: React.FC = () => {
  const { userId } = useAuth();
  const location = useLocation();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'self' | 'random' | 'friend' | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [abortMessage, setAbortMessage] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as LocationState | undefined;
    if (state && state.gameId) {
      setGameId(state.gameId);
      setQuizQuestions(state.quizQuestions);
      setOpponent(state.opponentId);
      setGameMode(state.gameMode);
      setIsGameReady(true);
    }
  }, [location.state]);

  const { status, opponent: matchedOpponent, loading, gameId: matchedGameId, quizQuestions: matchedQuizQuestions } = useMatchmaking(userId, selectedDifficulty, gameMode);

  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);

  const openFriendModal = () => setIsFriendModalOpen(true);
  const closeFriendModal = () => setIsFriendModalOpen(false);

  const handleGameModeChange = async (mode: 'self' | 'random' | 'friend') => {
    console.log(`User selected game mode: ${mode}`);
    setGameMode(mode);
    if (!selectedDifficulty) return;

    if (mode === "self") {
      try {
        const token = await getIdToken();
        const response = await api.post<{ gameId: string; quizQuestions: Question[] }>(
          "/games",
          {
            gameMode: "self",
            userId,
            difficulty: selectedDifficulty,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Self game created:", response.data);
        setGameId(response.data.gameId);
        setQuizQuestions(response.data.quizQuestions);
        setIsGameReady(true);
      } catch (error: unknown) {
        console.error("Error creating self game:", error);
      }
    } else if (mode === "random") {
      try {
        // Fix thisss
      } catch (error: unknown) {
        console.error("Error in random matchmaking:", error);
      }
    } else if (mode === "friend") {
      openFriendModal();
    }
  };

  useEffect(() => {
    if (!userId) return;

    socket.emit("authenticate", { userId });
    console.log("Authenticate emitted from DifficultyPage");

    const handleGameAborted = (data: { message: string }) => {
      console.log("Game aborted:", data);
      setAbortMessage(data.message);
      setIsGameReady(false);
    };

    const handleError = (data: { message: string }) => {
      console.error("Matchmaking error:", data.message);
      setMatchError(data.message);
    };

    const handleStartGame = (data: StartGameData) => {
      console.log("Start game received in DifficultyPage:", data);
      const { gameId, quizQuestions, opponentId, gameMode } = data;
      setGameId(gameId);
      setQuizQuestions(quizQuestions);
      setOpponent(opponentId);
      setGameMode(gameMode);
      setIsGameReady(true);
    };

    socket.on("gameAborted", handleGameAborted);
    socket.on("error", handleError);
    socket.on("startGame", handleStartGame);

    return () => {
      socket.off("gameAborted", handleGameAborted);
      socket.off("error", handleError);
      socket.off("startGame", handleStartGame);
    };
  }, [userId]);

  useEffect(() => {
    if (status === 'matched' && matchedGameId && matchedQuizQuestions) {
      setGameId(matchedGameId);
      setQuizQuestions(matchedQuizQuestions);
      setOpponent(matchedOpponent);
      setIsGameReady(true);
    }
  }, [status, matchedGameId, matchedQuizQuestions, matchedOpponent]);

  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
  };

  const closeModal = () => {
    setAbortMessage(null);
    setMatchError(null);
  };

  if (isGameReady && gameId) {
    return (
      <div className="quiz-page">
        <Header />
        <QuizComponent
          gameId={gameId}
          userId={userId!}
          opponent={opponent}
          gameMode={gameMode as "self" | "random" | "friend"}
          initialQuizQuestions={quizQuestions}
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
              <button onClick={() => handleDifficultySelect("Easy")} className="options-button">Easy</button>
              <button onClick={() => handleDifficultySelect("Intermediate")} className="options-button">Intermediate</button>
              <button onClick={() => handleDifficultySelect("Hard")} className="options-button">Hard</button>
            </div>
          </>
        ) : (
          <>
            <h1>Choose Game Mode</h1>
            <div className="game-mode-buttons">
              <button onClick={() => handleGameModeChange("self")} disabled={loading} className="options-button">
                Play Against Yourself
              </button>
              <button onClick={() => handleGameModeChange("random")} disabled={loading} className="options-button">
                Play Against Random User
              </button>
              <button onClick={() => handleGameModeChange("friend")} disabled={loading} className="options-button">
                Play Against a Friend
              </button>
            </div>

            {gameMode === "random" && (
              <div>
                {loading ? (
                  <p>Looking for a match...</p>
                ) : (
                  <p>Waiting for a match...</p>
                )}
                {status === 'matched' && <p>Match found! Starting game...</p>}
                {status === 'waiting' && <p>Waiting for another player...</p>}
              </div>
            )}
          </>
        )}
      </main>
      {(abortMessage || matchError) && (
        <Modal onClose={closeModal}>
          <p>{abortMessage || matchError || "An unknown error occurred."}</p>
        </Modal>
      )}
      {isFriendModalOpen && selectedDifficulty && (
        <PlayAgainstFriendModal
          userId={userId!}
          onClose={closeFriendModal}
          difficulty={selectedDifficulty}
        />
      )}
    </div>
  );
};

export default DifficultyPage;