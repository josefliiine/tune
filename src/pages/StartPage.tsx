import tuneLogo from '../assets/images/tune-logotype.png';

const StartPage = () => {
  return (
    <div className="start-page">
      <header className="header">
        <img src={tuneLogo} alt="Golden tune logo" className="small-logo" />
        <button className="menu-button">
          <span className="hamburger-icon">☰</span>
        </button>
      </header>
      <main className="main-content">
        <p className="main-text">Let's see if you are the ultimate Tune master!</p>
        <button className="button">Start Game</button>
      </main>
    </div>
  );
};

export default StartPage;