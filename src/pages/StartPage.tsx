import tuneLogo from '../assets/images/tune-logotype.png';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StartPage = () => {
    const [openHamburgerMenu, setOpenHamburgerMenu] = useState(false);
    const navigate = useNavigate();

    const openMenu = () => {
        setOpenHamburgerMenu(!openHamburgerMenu);
    };

    const closeMenu = () => {
        setOpenHamburgerMenu(false);
    };

    const navigateToUserPage = () => {
      navigate('/user-page')
    };

  return (
    <div className="start-page">
      <header className="header">
        <img src={tuneLogo} alt="Golden tune logo" className="small-logo" />
        <button className="menu-button" onClick={openMenu}>
          <span className="hamburger-icon">☰</span>
        </button>
      </header>
      <main className="main-content">
        <p className="main-text">Let's see if you are the ultimate Tune master!</p>
        <button className="button">Start Game</button>

        {openHamburgerMenu && (
            <div className="menu">
            <button className="close-button" onClick={closeMenu}>x</button>
                <ul>
                    <li onClick={navigateToUserPage}>My page</li>
                    <li>My friends</li>
                    <li>My statistics</li>
                    <li>Log out</li>
                </ul>
            </div>
        )}
      </main>
    </div>
  );
};

export default StartPage;