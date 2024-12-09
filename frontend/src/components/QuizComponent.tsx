import { useState, useEffect, useRef } from "react";
import { Question } from "../types/Questions";
import { getIdToken } from "../utils/getIdToken";
import api from "../api/axiosConfig";

const QuizComponent = ({
  gameId,
  userId,
  opponent,
  gameMode,
  quizQuestions,
}: {
  gameId: string;
  userId: string;
  opponent: string | null;
  gameMode: "self" | "random" | null;
  quizQuestions: Question[];
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [waitingForOpponent, setWaitingForOpponent] = useState<boolean>(false);
  const [isQuizComplete, setIsQuizComplete] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);

  const prevQuestionIndexRef = useRef<number>(currentQuestionIndex);

  const fetchGameStatus = async () => {
    try {
      if (!isPollingActive) return;

      const response = await api.get(`/games/${gameId}`, {
        headers: {
          Authorization: `Bearer ${await getIdToken()}`,
        },
      });
      const data = response.data;

      console.log("Game data from backend:", data);

      if (data && typeof data.currentQuestionIndex === "number") {
        if (data.currentQuestionIndex !== currentQuestionIndex) {
          setCurrentQuestionIndex(data.currentQuestionIndex);

          if (data.currentQuestionIndex >= quizQuestions.length) {
            setIsQuizComplete(true);
          }
        }
      }

      if (gameMode === "random" && data?.player1Answered && data?.player2Answered) {
        if (userId === data.player1) {
          await api.put(`/games/${gameId}/next-question`, {}, {
            headers: {
              Authorization: `Bearer ${await getIdToken()}`,
            },
          });
          setWaitingForOpponent(false);
          setSelectedAnswer(null);
          setIsCorrect(null);
        }
      }
    } catch (error) {
      console.error("Error fetching game status:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchGameStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [gameId, isPollingActive]);

  useEffect(() => {
    if (currentQuestionIndex !== prevQuestionIndexRef.current) {
      console.log(
        "Question index changed from",
        prevQuestionIndexRef.current,
        "to",
        currentQuestionIndex,
        "Resetting selectedAnswer."
      );
      setSelectedAnswer(null);
      setIsCorrect(null);
      prevQuestionIndexRef.current = currentQuestionIndex;
    }
  }, [currentQuestionIndex]);

  const handleAnswerSelect = async (answer: string) => {
    if (isQuizComplete || selectedAnswer) {
      return;
    }

    setSelectedAnswer(answer);
    setIsPollingActive(false);

    const currentQ = quizQuestions[currentQuestionIndex];
    const correct = currentQ.correctAnswer === answer;
    setIsCorrect(correct);

    if (correct) {
      setScore((prevScore) => prevScore + 1);
    }

    try {
      await api.post(
        `/games/${gameId}/answer`,
        {
          userId,
          answer,
        },
        {
          headers: {
            Authorization: `Bearer ${await getIdToken()}`,
          },
        }
      );

      if (gameMode === "self") {
        if (currentQuestionIndex + 1 < quizQuestions.length) {
          setTimeout(() => {
            setCurrentQuestionIndex((prev) => prev + 1);
            setSelectedAnswer(null);
            setIsCorrect(null);
            setIsPollingActive(true);
          }, 2000);
        } else {
          setTimeout(() => {
            setIsQuizComplete(true);
          }, 2000);
        }
      } else if (gameMode === "random") {
        setWaitingForOpponent(true);
        setIsPollingActive(true);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setIsPollingActive(true);
    }
  };

  if (isQuizComplete) {
    return (
      <div>
        <h2>Quiz Complete!</h2>
        <p>
          Your score: {score} / {quizQuestions.length}
        </p>
        {gameMode === "random" && <p>Opponent: {opponent}</p>}
      </div>
    );
  }

  if (currentQuestionIndex < 0 || currentQuestionIndex >= quizQuestions.length) {
    return <div>Loading question...</div>;
  }

  const currentQ = quizQuestions[currentQuestionIndex];
  if (!currentQ) {
    return <div>Loading question...</div>;
  }

  return (
    <div>
      <h2>Question {currentQuestionIndex + 1}</h2>
      <p>{currentQ.question}</p>
      <div>
        {currentQ.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(answer)}
            disabled={isQuizComplete || waitingForOpponent || !!selectedAnswer}
          >
            {answer}
          </button>
        ))}
      </div>
      {selectedAnswer && (
        <p>
          {isCorrect
            ? "Correct!"
            : `Wrong! The correct answer is: ${currentQ.correctAnswer}`}
        </p>
      )}
      {waitingForOpponent && <p>Waiting for opponent...</p>}
    </div>
  );
};

export default QuizComponent;