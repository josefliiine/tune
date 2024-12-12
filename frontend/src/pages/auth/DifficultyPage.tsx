import { useEffect, useState } from "react";
import Header from "../../components/Header";
import QuizComponent from "../../components/QuizComponent";
import Modal from "../../components/Modal";
import { Question } from "../../types/Questions";
import socket from "../../socket";
import api from "../../api/axiosConfig";
import { getIdToken } from "../../utils/getIdToken";
import useMatchmaking from "../../hooks/useMatchMaking";
import PlayAgainstFriendModal from "../../components/PlayAgainstFriendModal";
import IncomingChallenges from "../../components/IncomingChallanges";

const DifficultyPage = ({ userId }: { userId: string }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'self' | 'random' | 'friend' | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [abortMessage, setAbortMessage] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

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
        const response = await api.post(
          "/games",
          {
            gameMode: "self",
            userId,
            difficulty: selectedDifficulty,
          },
          {
            headers: {
              Authorization: `Bearer ${await getIdToken()}`,
            },
          }
        );
        console.log("Self game created:", response.data);
        setGameId(response.data.gameId);
        setQuizQuestions(response.data.quizQuestions);
        setIsGameReady(true);
      } catch (error) {
        console.error("Error creating self game:", error);
      }
    } else if (mode === "friend") {
      openFriendModal();
    }
  };

  useEffect(() => {
    socket.emit("authenticate", { userId });

    socket.on("gameAborted", (data) => {
      console.log("Game aborted:", data);
      setAbortMessage(data.message);
      setIsGameReady(false);
    });

    socket.on("error", (data) => {
      console.error("Matchmaking error:", data.message);
      setMatchError(data.message);
    });

    return () => {
      socket.off("gameAborted");
      socket.off("error");
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
          userId={userId}
          opponent={opponent}
          gameMode={gameMode as "self" | "random" | "friend"}
          initialQuizQuestions={quizQuestions}
        />
        <IncomingChallenges />
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
              <button onClick={() => handleGameModeChange("self")} disabled={loading}>
                Play Against Yourself
              </button>
              <button onClick={() => handleGameModeChange("random")} disabled={loading}>
                Play Against Random User
              </button>
              <button onClick={() => handleGameModeChange("friend")} disabled={loading}>
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
      {isFriendModalOpen && <PlayAgainstFriendModal userId={userId} onClose={closeFriendModal} />}
      <IncomingChallenges />
    </div>
  );
};

export default DifficultyPage;