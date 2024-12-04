import { useState, useEffect } from "react";
import Header from "../components/Header";
import useQuestionsByDifficulty from "../hooks/useQuestionsByDifficulty";
import { Question } from "../types/Questions";

const DifficultyPage = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [isQuizComplete, setIsQuizComplete] = useState<boolean>(false);

  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
  };

  const { questions, loading, error } = useQuestionsByDifficulty(selectedDifficulty || "");

  useEffect(() => {
    if (questions.length > 0) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      setQuizQuestions(shuffled.slice(0, 10));
    }
  }, [questions]);

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
          {loading && <p>Loading questions...</p>}
          {error && <p>{error}</p>}
          {!loading && !error && isQuizComplete ? (
            <div>
              <h2>Quiz ended!</h2>
            </div>
          ) : (
            quizQuestions.length > 0 && (
              <div>
                <h2>Question {currentQuestionIndex + 1} of 10</h2>
                <p>{quizQuestions[currentQuestionIndex]?.question}</p>
                <button onClick={handleNextQuestion}>
                  {currentQuestionIndex < quizQuestions.length - 1 ? "Next" : "Finish"}
                </button>
              </div>
            )
          )}
        </main>
      )}
    </div>
  );
};

export default DifficultyPage;