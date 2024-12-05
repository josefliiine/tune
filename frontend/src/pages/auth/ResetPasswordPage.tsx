import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import useAuth from "../../hooks/useAuth.ts";

const ResetPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage(null);

    try {
      await resetPassword(email);
      setSuccessMessage("Please follow the instructions sent to your email to reset your password.");
      
      // Redirect to login page after 10 seconds
      setTimeout(() => {
        navigate("/login");
      }, 10000);
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
        <h2>Reset password</h2>
        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}
        {!successMessage && (
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">E-mail:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Resetting password..." : "Reset password"}
            </button>
          </form>
        )}
        <p>
          Suddenly remembered your password? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;