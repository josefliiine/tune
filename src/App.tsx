import { Routes, Route } from "react-router-dom";
import "./assets/scss/App.scss";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignupPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

function App() {

  return (
    <Routes>
      <Route>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ResetPasswordPage />} />
      </Route>
    </Routes>
  )
}

export default App
