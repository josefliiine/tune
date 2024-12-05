import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import useAuth from "../../hooks/useAuth.ts";

const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage(null);

    try {
      await signup(email, password);
      setSuccessMessage("Account created successfully! You will soon be redirected to the login page.");
      
      // Redirect to login page after 7 seconds
      setTimeout(() => {
        navigate("/login");
      }, 7000);
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
        <h2>Create account</h2>
        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail:</label>
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
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;