import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import tuneLogo from '../assets/images/tune-logo-record.png';

const NotFoundPage = () => {
    const navigate = useNavigate();

    const goBack = () => {
        navigate("/");
    };

    return (
      <motion.div
        className="container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="logo-container"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.img
            src={tuneLogo}
            alt="Golden tune logo"
            className="logo"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />
          <motion.p
          className="landing-page-p"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            404 - Page not found
          </motion.p>
        </motion.div>
        <motion.button
          className="button-landing-page"
          onClick={goBack}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to tune
        </motion.button>
      </motion.div>
    );
};

export default NotFoundPage;