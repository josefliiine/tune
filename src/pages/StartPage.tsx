import Header from '../components/Header';
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
        <p className="main-text">Let's see if you are the ultimate Tune master!</p>
        <button className="button" onClick={handleStartGame}>Start Game</button>
      </main>
    </div>
  );
};

export default StartPage;