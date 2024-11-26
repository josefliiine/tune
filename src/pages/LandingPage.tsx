import { useNavigate } from "react-router-dom";

const LandingPage = () => {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate("/login");
    };

    return (
      <div className="container">
        <div className="logo-container">
          <img src="my-logo" alt="Golden tune logo" className="logo" />
          <p>Your music quiz app</p>
        </div>
        <button className="button" onClick={handleLogin}>Log in</button>
      </div>
    );
  };
  
  export default LandingPage;