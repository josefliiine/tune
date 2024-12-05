import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import useAuth from "../../hooks/useAuth";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login(email, password);
      navigate("/start-page");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-box">
        <h2>Log in to Tune</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>
        <div className="links">
          <p>
            You don't have an account? <Link to="/signup">Sign up</Link>
          </p>
          <p>
            Forgot your password? <Link to="/forgot-password">Reset password</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;