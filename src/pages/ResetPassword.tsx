import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  resetPassword,
  verifyPasswordResetToken,
} from "../helpers/api/apiHelpers";
import { setTitle } from "../helpers/metadataHelper";

function useQuery() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location.search]);
}

export default function ResetPassword() {
  const query = useQuery();
  const navigate = useNavigate();

  const token = (query.get("token") || "").trim();

  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const cleanup = setTitle("Reset Password • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsChecking(true);
      setError(null);

      if (!token) {
        setIsValid(false);
        setIsChecking(false);
        return;
      }

      try {
        const valid = await verifyPasswordResetToken(token);
        if (!cancelled) {
          setIsValid(valid);
        }
      } catch {
        if (!cancelled) {
          setIsValid(false);
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ token, newPassword: password });
      setSuccess(true);
      window.setTimeout(() => {
        navigate("/account/login", { replace: true });
      }, 1200);
    } catch (err) {
      console.error("Error resetting password", err);
      setError((err as Error).message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <section className="auth-card">
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">Choose a new password for your account.</p>

        {isChecking ? (
          <p className="auth-subtitle">Checking reset link…</p>
        ) : !isValid ? (
          <>
            <p className="auth-error">
              This reset link is invalid or has expired.
            </p>
            <Link to="/account/forgot-password" className="auth-toggle">
              Request a new reset link
            </Link>
          </>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>New password</span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Confirm password</span>
              <input
                type="password"
                name="passwordConfirm"
                placeholder="••••••••"
                required
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            {success && (
              <p className="auth-success">Password updated. Redirecting…</p>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        <Link to="/account/login" className="auth-toggle">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
