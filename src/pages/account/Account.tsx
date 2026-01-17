import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAPIBase } from "../../helpers/api/apiHelpers";
import { setTitle } from "../../helpers/metadataHelper";
import styles from "./Account.module.css";
import { useCurrentUser } from "../../context/CurrentUserContext";
import type { User } from "../../models/user";

const API_BASE = getAPIBase();

export default function Account() {
  const {
    user,
    isAuthenticated,
    authedFetch,
    refreshCurrentUser,
    setAuthSession,
    clearAuthSession,
  } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  const [emailDraft, setEmailDraft] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailUpdateError, setEmailUpdateError] = useState<string | null>(null);
  const [emailUpdateSuccess, setEmailUpdateSuccess] = useState<string | null>(
    null
  );

  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNext, setPasswordNext] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState<string | null>(
    null
  );
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState<
    string | null
  >(null);

  const loginLink = `/account/login?redirect=${encodeURIComponent(
    location.pathname + location.search
  )}`;

  useEffect(() => {
    const cleanup = setTitle("Account • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        setError("You need to be signed in to view your account.");
        return;
      }

      try {
        setError(null);
        await refreshCurrentUser();
      } catch (err) {
        console.error("Error loading account", err);
        setError("Something went wrong while loading your account.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [isAuthenticated, refreshCurrentUser]);

  useEffect(() => {
    if (user?.email) {
      setEmailDraft(user.email);
    }
  }, [user?.email]);

  if (isLoading) {
    return (
      <main>
        <h1>Account</h1>
        <p>Loading your account...</p>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main>
        <h1>Account</h1>
        <p>{error}</p>
        <p>
          <Link to={loginLink}>Go to login</Link>
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <h1>Account</h1>
        <p>Account information is not available.</p>
      </main>
    );
  }

  const createdAt = new Date(user.createdAt).toLocaleString();
  const lastUpdated = user.lastUpdatedAt
    ? new Date(user.lastUpdatedAt).toLocaleString()
    : null;

  const clearAuthAndPromptLogin = (message: string) => {
    clearAuthSession();
    setError(message);
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailUpdateError(null);
    setEmailUpdateSuccess(null);

    if (!isAuthenticated) {
      clearAuthAndPromptLogin("You need to be signed in to update your email.");
      return;
    }

    const nextEmail = emailDraft.trim();
    if (!nextEmail) {
      setEmailUpdateError("Email is required.");
      return;
    }
    if (!emailCurrentPassword) {
      setEmailUpdateError("Current password is required.");
      return;
    }
    if (nextEmail === user.email) {
      setEmailUpdateError("That’s already your current email.");
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const response = await authedFetch(`${API_BASE}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: nextEmail,
          currentPassword: emailCurrentPassword,
        }),
        requireAuth: true,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to update email.";

        if (
          response.status === 401 &&
          (message.includes("Invalid or expired token") ||
            message.includes("Missing or invalid Authorization") ||
            message.includes("Invalid token"))
        ) {
          clearAuthAndPromptLogin("Your session expired. Please log in again.");
          return;
        }

        setEmailUpdateError(message);
        return;
      }

      if (data && data.user) {
        const updatedUser = data.user as User;
        setAuthSession({ user: updatedUser });
      }
      if (data && typeof data.token === "string") {
        setAuthSession({ token: data.token });
      }

      setEmailCurrentPassword("");
      setEmailUpdateSuccess("Email updated.");
    } catch (err) {
      console.error("Error updating email", err);
      setEmailUpdateError("Something went wrong while updating your email.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdateError(null);
    setPasswordUpdateSuccess(null);

    if (!isAuthenticated) {
      clearAuthAndPromptLogin(
        "You need to be signed in to update your password."
      );
      return;
    }

    if (!passwordCurrent) {
      setPasswordUpdateError("Current password is required.");
      return;
    }
    if (!passwordNext || passwordNext.trim().length < 6) {
      setPasswordUpdateError("New password must be at least 6 characters.");
      return;
    }
    if (passwordNext !== passwordConfirm) {
      setPasswordUpdateError("New password and confirmation do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await authedFetch(`${API_BASE}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordCurrent,
          newPassword: passwordNext,
        }),
        requireAuth: true,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to update password.";

        if (
          response.status === 401 &&
          (message.includes("Invalid or expired token") ||
            message.includes("Missing or invalid Authorization") ||
            message.includes("Invalid token"))
        ) {
          clearAuthAndPromptLogin("Your session expired. Please log in again.");
          return;
        }

        setPasswordUpdateError(message);
        return;
      }

      if (data && data.user) {
        const updatedUser = data.user as User;
        setAuthSession({ user: updatedUser });
      }
      if (data && typeof data.token === "string") {
        setAuthSession({ token: data.token });
      }

      setPasswordCurrent("");
      setPasswordNext("");
      setPasswordConfirm("");
      setPasswordUpdateSuccess("Password updated.");
    } catch (err) {
      console.error("Error updating password", err);
      setPasswordUpdateError(
        "Something went wrong while updating your password."
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <main>
      <h1>Account</h1>

      <div className={styles.stack}>
        <section className="auth-card">
          <h2 className={styles.sectionTitle}>Account details</h2>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Created:</strong> {createdAt}
          </p>
          {lastUpdated ? (
            <p>
              <strong>Last updated:</strong> {lastUpdated}
            </p>
          ) : null}
        </section>

        <section className="auth-card">
          <h2 className={styles.sectionTitle}>Update email</h2>
          <form className="auth-form" onSubmit={handleUpdateEmail}>
            <label className="auth-field">
              <span>New email</span>
              <input
                type="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>

            <label className="auth-field">
              <span>Current password</span>
              <input
                type="password"
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </label>

            {emailUpdateError ? (
              <p className="auth-error">{emailUpdateError}</p>
            ) : null}
            {emailUpdateSuccess ? (
              <p className="auth-success">{emailUpdateSuccess}</p>
            ) : null}

            <button
              type="submit"
              className="auth-submit"
              disabled={isUpdatingEmail}
            >
              {isUpdatingEmail ? "Updating…" : "Update email"}
            </button>
          </form>
        </section>

        <section className="auth-card">
          <h2 className={styles.sectionTitle}>Change password</h2>
          <form className="auth-form" onSubmit={handleUpdatePassword}>
            <label className="auth-field">
              <span>Current password</span>
              <input
                type="password"
                value={passwordCurrent}
                onChange={(e) => setPasswordCurrent(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </label>

            <label className="auth-field">
              <span>New password</span>
              <input
                type="password"
                value={passwordNext}
                onChange={(e) => setPasswordNext(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 6 characters"
              />
            </label>

            <label className="auth-field">
              <span>Confirm new password</span>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat new password"
              />
            </label>

            {passwordUpdateError ? (
              <p className="auth-error">{passwordUpdateError}</p>
            ) : null}
            {passwordUpdateSuccess ? (
              <p className="auth-success">{passwordUpdateSuccess}</p>
            ) : null}

            <button
              type="submit"
              className="auth-submit"
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
