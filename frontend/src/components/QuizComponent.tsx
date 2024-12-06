import { useState, useEffect, useRef } from "react";
import { doc, getFirestore, updateDoc, onSnapshot } from "firebase/firestore";
import { Question } from "../types/Questions.ts";
import { updatePlayerAnswer } from "../services/gameFunctions";

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
  const db = getFirestore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [waitingForOpponent, setWaitingForOpponent] = useState<boolean>(false);
  const [isQuizComplete, setIsQuizComplete] = useState<boolean>(false);

  const gameRef = doc(db, "games", gameId);

  const prevQuestionIndexRef = useRef<number>(currentQuestionIndex);

  useEffect(() => {
    const unsubscribe = onSnapshot(gameRef, (docSnapshot) => {
      const data = docSnapshot.data();
      console.log("Game data from snapshot:", data);
      if (data) {
        let idx = data.currentQuestionIndex;
        if (typeof idx !== 'number') {
          console.warn("currentQuestionIndex is not a number, defaulting to 0");
          idx = 0;
        }

        setCurrentQuestionIndex(idx);

        if (idx >= quizQuestions.length) {
          setIsQuizComplete(true);
        }

        if (data.player1Answered && data.player2Answered) {
          if (userId === data.player1) {
            console.log("I am player1 and both answered, incrementing currentQuestionIndex from", idx, "to", idx + 1);
            if (!waitingForOpponent) {
              setWaitingForOpponent(true);
            }
            updateDoc(gameRef, {
              player1Answered: false,
              player2Answered: false,
              currentQuestionIndex: idx + 1,
            }).then(() => {
              console.log("Incremented currentQuestionIndex to", idx + 1);
              setWaitingForOpponent(false);
              setSelectedAnswer(null);
            });
          } else {
            console.log("I am not player1, waiting for player1 to increment");
          }
        }
      }
    });

    return () => unsubscribe();
  }, [gameRef, waitingForOpponent, quizQuestions.length, userId]);

  useEffect(() => {
    if (currentQuestionIndex !== prevQuestionIndexRef.current) {
      console.log("Question index changed from", prevQuestionIndexRef.current, "to", currentQuestionIndex, "Resetting selectedAnswer.");
      setSelectedAnswer(null);
      prevQuestionIndexRef.current = currentQuestionIndex; 
    }
  }, [currentQuestionIndex]);

  const handleAnswerSelect = async (answer: string) => {
    if (isQuizComplete) {
        return;
    }
    setSelectedAnswer(answer);

    if (quizQuestions[currentQuestionIndex] && answer === quizQuestions[currentQuestionIndex].correctAnswer) {
      setScore((prevScore) => prevScore + 1);
    }

    await updatePlayerAnswer(gameId, userId);
  };

  if (isQuizComplete) {
    return (
      <div>
        <h2>Quiz Complete!</h2>
        <p>Your score: {score} / {quizQuestions.length}</p>
        {gameMode === 'random' && <p>Opponent: {opponent}</p>}
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
            disabled={ isQuizComplete || waitingForOpponent || !!selectedAnswer}
          >
            {answer}
          </button>
        ))}
      </div>
      {waitingForOpponent && <p>Waiting for opponent...</p>}
    </div>
  );
};

export default QuizComponent;