import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

const HamburgerMenu = () => {
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

    const navigateToStartPage = () => {
      navigate('/start-page')
    };

    const navigateToFriendsPage = () => {
      navigate('/friends-page')
    };

    const logOut = () => {
      signOut(auth).then(() => {
        navigate('/')
      }).catch((error) => {
        console.error(error);
      })
    }

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
                <li>My statistics</li>
                <li onClick={logOut}>Log out</li>
              </ul>
            </div>
          )}
        </div>
      );
}

export default HamburgerMenu;