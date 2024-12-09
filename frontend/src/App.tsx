import { Routes, Route } from "react-router-dom";
import "./assets/scss/App.scss";
import LandingPage from "./pages/LandingPage.tsx";
import LoginPage from "./pages/auth/LoginPage.tsx";
import SignUpPage from "./pages/auth/SignupPage.tsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.tsx";
import StartPage from "./pages/auth/StartPage.tsx";
import UserPage from "./pages/auth/UserPage.tsx";
import FriendsPage from "./pages/auth/FriendsPage.tsx";
import DifficultyPage from "./pages/auth/DifficultyPage.tsx";
import useAuth from "./hooks/useAuth.ts";
import NotFoundPage from "./pages/NotFoundPage.tsx";

function App() {

  return (
    <Routes>
      <Route>
        <Route path="*" element={<NotFoundPage />} />
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
