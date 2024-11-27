import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
                <li onClick={navigateToUserPage}>My page</li>
                <li>My friends</li>
                <li>My statistics</li>
                <li>Log out</li>
              </ul>
            </div>
          )}
        </div>
      );
}

export default HamburgerMenu;