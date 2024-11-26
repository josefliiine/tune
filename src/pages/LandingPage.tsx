import { useNavigate } from "react-router-dom";
import tuneLogo from '../assets/images/tune-logotype.png';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate("/login");
    };

    return (
      <div className="container">
        <div className="logo-container">
          <img src={tuneLogo} alt="Golden tune logo" className="logo" />
          <p>Your music quiz app</p>
        </div>
        <button className="button" onClick={handleLogin}>Log in</button>
      </div>
    );
  };
  
  export default LandingPage;