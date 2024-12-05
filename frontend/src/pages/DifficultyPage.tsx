import { useState, useEffect } from "react";
import Header from "../components/Header.tsx";
import useQuestionsByDifficulty from "../hooks/useQuestionsByDifficulty.ts";
import useMatchmaking from "../hooks/useMatchMaking.ts";
import { Question } from "../types/Questions.ts";

const DifficultyPage = ({ userId }: { userId: string }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'self' | 'random' | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [isQuizComplete, setIsQuizComplete] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);

  const { status, opponent, loading } = useMatchmaking(userId);

  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
  };

  const { questions, loading: questionsLoading, error: questionsError } = useQuestionsByDifficulty(
    selectedDifficulty || ""
  );

  useEffect(() => {
    if (questions.length > 0) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      setQuizQuestions(shuffled.slice(0, 10));
    }
  }, [questions]);

  const handleGameModeChange = (mode: 'self' | 'random') => {
    setGameMode(mode);
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);

    if (answer === quizQuestions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      handleNextQuestion();
    }, 1000);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsQuizComplete(true);
    }
  };

  return (
    <div className="difficulty-page">
      <Header />
      {!selectedDifficulty ? (
        <main className="main-content">
          <h1>Choose Difficulty</h1>
          <div className="difficulty-buttons">
            <button onClick={() => handleDifficultySelect("Easy")}>Easy</button>
            <button onClick={() => handleDifficultySelect("Intermediate")}>Intermediate</button>
            <button onClick={() => handleDifficultySelect("Hard")}>Hard</button>
          </div>
        </main>
      ) : (
        <main className="main-content">
          <div className="game-mode-buttons">
            <button onClick={() => handleGameModeChange("self")}>Play Against Yourself</button>
            <button onClick={() => handleGameModeChange("random")}>Play Against Random User</button>
          </div>

          {gameMode === "random" && (
            <div>
              {loading ? (
                <p>Looking for a match...</p>
              ) : status === "matched" ? (
                <p>Matched with user: {opponent}</p>
              ) : (
                <p>Waiting for a match...</p>
              )}
            </div>
          )}

          {questionsLoading && <p>Loading questions...</p>}
          {questionsError && <p>{questionsError}</p>}
          {!questionsLoading && !questionsError && isQuizComplete ? (
            <div>
              <h2>Quiz Complete!</h2>
              <p>Your score: {score} / 10</p>
            </div>
          ) : (
            quizQuestions.length > 0 && (
              <div>
                <h2>Question {currentQuestionIndex + 1} of 10</h2>
                <p>{quizQuestions[currentQuestionIndex]?.question}</p>
                <div className="answer-buttons">
                  {quizQuestions[currentQuestionIndex]?.answers.map((answer, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(answer)}
                      className={
                        selectedAnswer
                          ? answer === quizQuestions[currentQuestionIndex].correctAnswer
                            ? "correct"
                            : "incorrect"
                          : ""
                      }
                      disabled={!!selectedAnswer}
                    >
                      {answer}
                    </button>
                  ))}
                </div>
                {selectedAnswer && (
                  <p>
                    {selectedAnswer === quizQuestions[currentQuestionIndex].correctAnswer
                      ? "Correct!"
                      : "Wrong!"}
                  </p>
                )}
              </div>
            )
          )}
        </main>
      )}
    </div>
  );
};

export default DifficultyPage;