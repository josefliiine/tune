import { Routes, Route, useLocation } from "react-router-dom";
import "./assets/scss/App.scss";
import LandingPage from "./pages/LandingPage.tsx";
import LoginPage from "./pages/auth/LoginPage.tsx";
import SignUpPage from "./pages/auth/SignupPage.tsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.tsx";
import StartPage from "./pages/auth/StartPage.tsx";
import UserPage from "./pages/auth/UserPage.tsx";
import FriendsPage from "./pages/auth/FriendsPage.tsx";
import DifficultyPage from "./pages/auth/DifficultyPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import ProtectedRoutes from "./components/ProtectedRoutes.tsx";
import IncomingChallenges from "./components/IncomingChallenges.tsx";
import MyStatisticsPage from "./pages/auth/MyStatisticsPage.tsx";
import { ToastContainer } from "react-toastify";
import ChatBubble from "./components/ChatBubble.tsx";
import { useEffect, useState } from "react";
import { auth } from "./services/firebase";
import useMyFriends from "./hooks/useMyFriends";

function App() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { friends, loading } = useMyFriends(currentUserId);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, []);

  const location = useLocation();
  const isProtectedRoute = location.pathname.includes("-page");

  return (
    <>
      <IncomingChallenges />
      <Routes>
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ResetPasswordPage />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/start-page" element={<StartPage />} />
          <Route path="/user-page" element={<UserPage />} />
          <Route path="/friends-page" element={<FriendsPage />} />
          <Route path="/difficulty-page" element={<DifficultyPage />} />
          <Route path="/mystatistics-page" element={<MyStatisticsPage />} />
        </Route>
      </Routes>

      <ToastContainer 
      closeOnClick 
      theme="colored" 
      limit={3} 
      stacked 
      />

      {isProtectedRoute && !loading && currentUserId && (
        <ChatBubble currentUserId={currentUserId} friends={friends} />
      )}
    </>
  );
}

export default App;