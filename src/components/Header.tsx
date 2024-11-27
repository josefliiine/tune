import HamburgerMenu from "./HamburgerMenu";
import tuneLogo from '../assets/images/tune-logotype.png';

const Header = () => {
    return (
      <header className="header">
        <img src={tuneLogo} alt="Tune Logo" className="logo" />
        <HamburgerMenu />
      </header>
    );
  };
  
  export default Header;