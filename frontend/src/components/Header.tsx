import { motion } from "framer-motion";
import HamburgerMenu from "./HamburgerMenu";
import tuneLogo from '../assets/images/tune-logo-record.png';

const Header = () => {
    return (
      <header className="header">
        <motion.img
          src={tuneLogo}
          alt="Tune Logo"
          className="logo-header"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
        />
        <HamburgerMenu />
      </header>
    );
};

export default Header;