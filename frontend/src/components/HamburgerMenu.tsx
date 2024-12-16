import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContextProvider';

const HamburgerMenu = () => {
    const [openHamburgerMenu, setOpenHamburgerMenu] = useState(false);
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);

    const openMenu = () => {
        setOpenHamburgerMenu(!openHamburgerMenu);
    };

    const closeMenu = () => {
        setOpenHamburgerMenu(false);
    };

    const navigateToUserPage = () => {
      navigate('/user-page');
      closeMenu();
    };

    const navigateToStartPage = () => {
      navigate('/start-page');
      closeMenu();
    };

    const navigateToFriendsPage = () => {
      navigate('/friends-page');
      closeMenu();
    };

    const navigateToMyStatisticsPage = () => {
      navigate('/mystatistics-page');
      closeMenu();
    };

    const handleLogout = async () => {
      try {
        await authContext?.logout();
        navigate('/');
      } catch (error) {
        console.error('Error when logging out:', error);
      }
    };

    return (
        <div>
          <button className="menu-button" onClick={openMenu}>
            <span className="hamburger-icon">☰</span>
          </button>
    
          {openHamburgerMenu && (
            <div className="menu">
              <button className="close-button" onClick={closeMenu}>
                x
              </button>
              <ul>
                <li onClick={navigateToStartPage}>Game page</li>
                <li onClick={navigateToUserPage}>My page</li>
                <li onClick={navigateToFriendsPage}>My friends</li>
                <li onClick={navigateToMyStatisticsPage}>My statistics</li>
                <li onClick={handleLogout}>Log out</li>
              </ul>
            </div>
          )}
        </div>
      );
}

export default HamburgerMenu;