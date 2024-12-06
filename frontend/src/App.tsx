import { Routes, Route } from "react-router-dom";
import "./assets/scss/App.scss";
import LandingPage from "./pages/LandingPage.tsx";
import LoginPage from "./pages/auth/LoginPage.tsx";
import SignUpPage from "./pages/auth/SignupPage.tsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.tsx";
import StartPage from "./pages/StartPage.tsx";
import UserPage from "./pages/UserPage.tsx";
import FriendsPage from "./pages/FriendsPage.tsx";
import DifficultyPage from "./pages/DifficultyPage.tsx";
import useAuth from "./hooks/useAuth.ts";

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
        <Route
          path="/difficulty-page"
          element={<DifficultyPage userId={useAuth().userId!} />}
        />
      </Route>
    </Routes>
  )
}

export default App
