import Header from '../components/Header.tsx';
import { useNavigate } from 'react-router-dom';

const StartPage = () => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate("/difficulty-page");
  }

  return (
    <div className="start-page">
      <Header />
      <main className="main-content">
        <p className="main-text">Let’s find out if you're a tune master… or a tune disaster!</p>
        <button className="button-start-page" onClick={handleStartGame}>Start Game</button>
      </main>
    </div>
  );
};

export default StartPage;