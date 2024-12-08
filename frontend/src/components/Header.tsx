import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { motion } from "framer-motion";
import HamburgerMenu from "./HamburgerMenu";
import tuneLogo from '../assets/images/tune-logo-record.png';

const Header = () => {
  const { userName, userEmail, photoURL } = useContext(UserContext);

  return (
    <header className="header">
      <div className="header-left">
        <motion.img
          src={tuneLogo}
          alt="Tune Logo"
          className="logo-header"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
        />
      </div>
      <div className="header-right">
        <span className="user-info">
          {userName ? userName : userEmail}
        </span>
        {photoURL && (
          <img src={photoURL} alt="Profile" className="profile-image" />
        )}
        <HamburgerMenu />
      </div>
    </header>
  );
};

export default Header;