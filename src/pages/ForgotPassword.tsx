import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../helpers/api/apiHelpers";
import { setTitle } from "../helpers/metadataHelper";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const cleanup = setTitle("Forgot Password • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await requestPasswordReset(trimmed);
      setSuccess(true);
    } catch (err) {
      console.error("Error requesting password reset", err);
      setError((err as Error).message || "Failed to request password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <section className="auth-card">
        <h1 className="auth-title">Forgot password</h1>
        <p className="auth-subtitle">
          Enter your email and we’ll send a reset link.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          {success && (
            <p className="auth-success">
              If an account exists for that email, a reset link has been sent.
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <Link to="/account/login" className="auth-toggle">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
