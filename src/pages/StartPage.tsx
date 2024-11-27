import Header from '../components/Header';

const StartPage = () => {
  return (
    <div className="start-page">
      <Header />
      <main className="main-content">
        <p className="main-text">Let's see if you are the ultimate Tune master!</p>
        <button className="button">Start Game</button>
      </main>
    </div>
  );
};

export default StartPage;