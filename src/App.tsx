import { Routes, Route } from "react-router-dom";
import "./assets/scss/App.scss";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignupPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import StartPage from "./pages/StartPage";
import UserPage from "./pages/UserPage";
import FriendsPage from "./pages/FriendsPage";

function App() {

  return (
    <Routes>
      <Route>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ResetPasswordPage />} />
        <Route path="/start-page" element={<StartPage />} />
        <Route path="/user-page" element={<UserPage />} />
        <Route path="/friends-page" element={<FriendsPage />} />
      </Route>
    </Routes>
  )
}

export default App
