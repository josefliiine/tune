import { useState } from "react";
import Header from "../components/Header";
import useQuestionsByDifficulty from "../hooks/useQuestionsByDifficulty";

const DifficultyPage = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
  };

  const { questions, loading, error } = useQuestionsByDifficulty(selectedDifficulty || "");

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
          {questions.length > 0 && (
            <ul>
              {questions.map((q, index) => (
                <li key={index}>{q.question}</li>
              ))}
            </ul>
          )}
        </main>
      )}
    </div>
  );
};

export default DifficultyPage;