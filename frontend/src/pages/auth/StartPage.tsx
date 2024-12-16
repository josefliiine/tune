import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import useLatestGames from '../../hooks/useLatestGames';

const StartPage = () => {
  const navigate = useNavigate();
  const { latestGames, loading, error } = useLatestGames();

  const handleStartGame = () => {
    navigate("/difficulty-page");
  };

  return (
    <div className="start-page">
      <Header />
      <main className="main-content">
        <p className="main-text">Let’s find out if you're a tune master… or a tune disaster!</p>
        <button className="button-start-page" onClick={handleStartGame}>Start Game</button>

        <section className="highscore-section">
          <h2>Latest Games</h2>
          {loading ? (
            <p>Loading latest games...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : latestGames.length === 0 ? (
            <p>No latest games played yet.</p>
          ) : (
            <ul className="highscore-list">
              {latestGames.map((game) => (
                <li key={game.gameId} className="highscore-item">
                  <div className="game-info">
                    <span className="game-mode">{mapGameMode(game.gameMode)}</span>
                    <span className={`result ${game.result}`}>{mapResult(game.result)}</span>
                    <span className="game-date">{formatDate(game.createdAt)}</span>
                  </div>
                  <div className="players-info">
                    {game.gameMode === 'self' ? (
                      <span className="player-score">
                        {game.player1.name}: {game.player1.score} poäng
                      </span>
                    ) : (
                      <span className="player-score">
                        {game.player1.name}: {game.player1.score} poäng vs {game.player2?.name}: {game.player2?.score} poäng
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

const mapResult = (result: 'win' | 'lose' | 'draw' | 'completed') => {
  switch(result) {
      case 'win': return 'Win';
      case 'lose': return 'Lose';
      case 'draw': return 'Draw';
      case 'completed': return 'Completed';
      default: return result;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const padZero = (num: number) => {
  return num < 10 ? `0${num}` : num;
};

const mapGameMode = (mode: string) => {
  switch(mode) {
      case 'self': return 'Self';
      case 'random': return 'Random';
      case 'friend': return 'Friend';
      default: return mode;
  }
};

export default StartPage;