import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import socket from "../socket";
import { Question } from "../types/Questions";

interface QuizComponentProps {
  gameId: string;
  userId: string;
  opponent: string | null;
  gameMode: "self" | "random" | "friend";
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
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null);

  const [finalResults, setFinalResults] = useState<{
    player1?: { id: string; name: string; score: number };
    player2?: { id: string; name: string; score: number };
    winner?: string;
  } | null>(null);

  const [recognitionInstance, setRecognitionInstance] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'sv-SE';
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      console.log("User said:", transcript);
      handleVoiceAnswer(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech Recognition Error:", event.error, event.message);
      if (event.error === 'no-speech') {
        recognition.start();
      }
    };

    recognition.onspeechstart = () => {
      console.log("Speech has been detected.");
    };

    recognition.onspeechend = () => {
      console.log("Speech has stopped being detected.");
    };

    recognition.onnomatch = () => {
      console.log("No match found for your speech.");
    };

    setRecognitionInstance(recognition);
  }, []);

  useEffect(() => {
    const handleStartGame = (data: any) => {
      setCurrentQuestionIndex(0);
      setLocalQuizQuestions(data.quizQuestions);
      setIsQuizComplete(false);
      setScore(0);
    };

    const handleNextQuestion = (data: any) => {
      setCurrentQuestionIndex(data.currentQuestionIndex);
      setLocalQuizQuestions((prevQuestions) => {
        const newQuestions = [...prevQuestions];
        newQuestions[data.currentQuestionIndex] = data.question;
        return newQuestions;
      });
      setIsCorrect(null);
      setSelectedAnswer(null);
      setWaitingMessage(null);
    };

    const handlePlayerAnswered = (data: any) => {
      if (data.userId === userId) {
        setIsCorrect(data.isCorrect);
        if (data.isCorrect) {
          setScore((prevScore) => prevScore + 1);
        }
      }
    };

    const handleGameFinished = () => {
      setIsQuizComplete(true);
    };

    const handleGameAborted = (data: any) => {
      setAbortMessage(data.message);
      setIsQuizComplete(true);
    };

    const handleWaitingForOpponent = (data: { message: string }) => {
      setWaitingMessage(data.message);
    };

    const handleError = (data: any) => {
      console.error("Error:", data.message);
    };

    const handleGameResults = (data: any) => {
      setFinalResults(data);
    };

    socket.on("startGame", handleStartGame);
    socket.on("nextQuestion", handleNextQuestion);
    socket.on("playerAnswered", handlePlayerAnswered);
    socket.on("gameFinished", handleGameFinished);
    socket.on("gameAborted", handleGameAborted);
    socket.on("waitingForOpponent", handleWaitingForOpponent);
    socket.on("error", handleError);
    socket.on("gameResults", handleGameResults);

    socket.emit("joinGame", { gameId, userId });

    return () => {
      socket.off("startGame", handleStartGame);
      socket.off("nextQuestion", handleNextQuestion);
      socket.off("playerAnswered", handlePlayerAnswered);
      socket.off("gameFinished", handleGameFinished);
      socket.off("gameAborted", handleGameAborted);
      socket.off("waitingForOpponent", handleWaitingForOpponent);
      socket.off("error", handleError);
      socket.off("gameResults", handleGameResults);
    };
  }, [gameId, userId]);

  const handleAnswerSelect = (answer: string) => {
    if (isQuizComplete || selectedAnswer) {
      return;
    }

    setSelectedAnswer(answer);
    socket.emit("submitAnswer", { gameId, userId, answer });
  };

  const handleVoiceAnswer = (spokenText: string) => {
    if (isQuizComplete) return;

    const currentQ = localQuizQuestions[currentQuestionIndex];
    if (!currentQ) return;

    const normalizedSpokenText = spokenText.toLowerCase();
    const matchedAnswer = currentQ.answers.find(answer =>
      answer.toLowerCase() === normalizedSpokenText
    );

    if (matchedAnswer) {
      socket.emit("submitAnswer", { gameId, userId, answer: matchedAnswer });
      setSelectedAnswer(matchedAnswer);
    } else {
      console.log("No options matches your answer.");
    }
  };

  if (isQuizComplete) {
    if (finalResults) {
      const { player1, player2, winner } = finalResults;
      const myResult = (player1 && player1.id === userId) ? player1 : player2;
      const opponentResult = (player1 && player1.id !== userId) ? player1 : player2;

      return (
        <div>
          <h2>Quiz Complete!</h2>
          {myResult && (
            <p>Your score: {myResult.score}</p>
          )}
          {opponentResult && (
            <p>
              Opponent: {opponentResult.name} - Score: {opponentResult.score}
            </p>
          )}
          {winner && winner !== 'draw' ? (
            <p>Winner: {winner}</p>
          ) : (
            <p>It's a draw!</p>
          )}
          {abortMessage && <p style={{ color: "red" }}>{abortMessage}</p>}
        </div>
      );
    }

    return (
      <div>
        <h2>Quiz Complete!</h2>
        <p>
          Your score: {score} / {localQuizQuestions.length}
        </p>
        {gameMode !== "self" && opponent && <p>Opponent: {opponent}</p>}
        {abortMessage && <p style={{ color: "red" }}>{abortMessage}</p>}
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
        {currentQ.answers.map((answer, index) => {
          const isSelected = answer === selectedAnswer;
          const isCorrectAnswer = isSelected && isCorrect === true;
          const isWrongAnswer = isSelected && isCorrect === false;

          return (
            <motion.button
              key={index}
              onClick={() => handleAnswerSelect(answer)}
              disabled={Boolean(isQuizComplete || selectedAnswer)}
              initial={{ scale: 1, borderColor: "gray" }}
              animate={{
                scale: isSelected ? 1.1 : 1,
                borderColor: isCorrectAnswer
                  ? "green"
                  : isWrongAnswer
                  ? "red"
                  : "gray",
              }}
              transition={{ duration: 0.3 }}
              style={{
                border: "2px solid",
                padding: "10px",
                margin: "5px",
                backgroundColor: isSelected ? (isCorrectAnswer ? "lightgreen" : "lightcoral") : "white",
              }}
            >
              {answer}
            </motion.button>
          );
        })}
      </div>
      {selectedAnswer && (
        <p>
          {isCorrect ? "Correct!" : `Wrong! The correct answer is: ${currentQ.correctAnswer}`}
        </p>
      )}
      {waitingMessage && (
        <p style={{ color: "black", fontStyle: "italic" }}>{waitingMessage}</p>
      )}

      {recognitionInstance && (
        <button onClick={() => recognitionInstance.start()} disabled={Boolean(selectedAnswer || isQuizComplete)}>
          Svara med röst
        </button>
      )}
    </div>
  );
};

export default QuizComponent;