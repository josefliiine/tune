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

  useEffect(() => {
    socket.emit("joinGame", { gameId, userId });

    // Listen to 'startGame' event
    socket.on("startGame", (data) => {
      console.log("Game started:", data);
      setCurrentQuestionIndex(0);
      setLocalQuizQuestions(data.quizQuestions);
      setIsQuizComplete(false);
      setScore(0);
    });

    // Listen to 'nextQuestion' event
    socket.on("nextQuestion", (data) => {
      console.log("Next question received:", data);
      setCurrentQuestionIndex(data.currentQuestionIndex);
      setIsCorrect(null);
      setSelectedAnswer(null);
    });

    // Listen to 'playerAnswered' event
    socket.on("playerAnswered", (data) => {
      console.log(`Player ${data.userId} answered correctly: ${data.isCorrect}`);
      if (data.userId === userId) {
        setIsCorrect(data.isCorrect);
        if (data.isCorrect) {
          setScore((prevScore) => prevScore + 1);
        }
      }
    });

    // Listen to 'gameFinished' event
    socket.on("gameFinished", (data) => {
      console.log("Game finished:", data);
      setIsQuizComplete(true);
    });

    // Listen to errors
    socket.on("error", (data) => {
      console.error("Error:", data.message);
      // Eventuellt visa ett meddelande i UI
    });

    return () => {
      socket.off("joinGame");
      socket.off("startGame");
      socket.off("nextQuestion");
      socket.off("playerAnswered");
      socket.off("gameFinished");
      socket.off("error");
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