import React, { useEffect, useState } from "react";
import socket from "../socket";
import { Question } from "../types/Questions";

interface QuizComponentProps {
  gameId: string;
  userId: string;
  opponent: string | null;
  gameMode: "self" | "random" | null;
  initialQuizQuestions: Question[];
}

const QuizComponent: React.FC<QuizComponentProps> = ({
  gameId,
  userId,
  opponent,
  gameMode,
  initialQuizQuestions,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isQuizComplete, setIsQuizComplete] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [localQuizQuestions, setLocalQuizQuestions] = useState<Question[]>(initialQuizQuestions);
  const [abortMessage, setAbortMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleStartGame = (data: any) => {
      console.log("Game started:", data);
      setCurrentQuestionIndex(0);
      setLocalQuizQuestions(data.quizQuestions);
      setIsQuizComplete(false);
      setScore(0);
    };

    const handleNextQuestion = (data: any) => {
      console.log("Next question received:", data);
      setCurrentQuestionIndex(data.currentQuestionIndex);
      setIsCorrect(null);
      setSelectedAnswer(null);
    };

    const handlePlayerAnswered = (data: any) => {
      console.log(`Player ${data.userId} answered correctly: ${data.isCorrect}`);
      if (data.userId === userId) {
        setIsCorrect(data.isCorrect);
        if (data.isCorrect) {
          setScore((prevScore) => prevScore + 1);
        }
      }
    };

    const handleGameFinished = (data: any) => {
      console.log("Game finished:", data);
      setIsQuizComplete(true);
    };

    const handleGameAborted = (data: any) => {
      console.log("Game aborted:", data);
      setAbortMessage(data.message);
      setIsQuizComplete(true);
    };

    const handleError = (data: any) => {
      console.error("Error:", data.message);
      // Show message in UI!!!
    };

    socket.on("startGame", handleStartGame);
    socket.on("nextQuestion", handleNextQuestion);
    socket.on("playerAnswered", handlePlayerAnswered);
    socket.on("gameFinished", handleGameFinished);
    socket.on("gameAborted", handleGameAborted);
    socket.on("error", handleError);

    socket.emit("joinGame", { gameId, userId });

    return () => {
      socket.off("startGame", handleStartGame);
      socket.off("nextQuestion", handleNextQuestion);
      socket.off("playerAnswered", handlePlayerAnswered);
      socket.off("gameFinished", handleGameFinished);
      socket.off("gameAborted", handleGameAborted);
      socket.off("error", handleError);
    };
  }, [gameId, userId]);

  const handleAnswerSelect = (answer: string) => {
    if (isQuizComplete || selectedAnswer) {
      return;
    }

    setSelectedAnswer(answer);

    socket.emit("submitAnswer", { gameId, userId, answer });
  };

  if (isQuizComplete) {
    return (
      <div>
        <h2>Quiz Complete!</h2>
        <p>
          Your score: {score} / {localQuizQuestions.length}
        </p>
        {gameMode === "random" && <p>Opponent: {opponent}</p>}
        {abortMessage && <p style={{ color: 'red' }}>{abortMessage}</p>}
      </div>
    );
  }

  if (currentQuestionIndex < 0 || currentQuestionIndex >= localQuizQuestions.length) {
    return <div>Loading question...</div>;
  }

  const currentQ = localQuizQuestions[currentQuestionIndex];
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
            disabled={isQuizComplete || !!selectedAnswer}
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
    </div>
  );
};

export default QuizComponent;