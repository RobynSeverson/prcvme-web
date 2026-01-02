import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [birthday, setBirthday] = useState("");
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const getSafeRedirectPath = (raw: string | null): string | null => {
    if (!raw) return null;

    // Only allow internal paths.
    if (!raw.startsWith("/")) return null;
    if (raw.startsWith("//")) return null;
    if (raw.includes("://")) return null;
    if (raw.startsWith("/login")) return null;

    return raw;
  };

  const redirectPath =
    getSafeRedirectPath(new URLSearchParams(location.search).get("redirect")) ||
    "/profile";

  const isRegister = mode === "register";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (isRegister) {
      if (password !== passwordConfirm) {
        setError("Passwords do not match.");
        return;
      }

      if (!birthday) {
        setError("Birthday is required.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";

      const payload: Record<string, unknown> = {
        email,
        password,
      };

      if (isRegister) {
        payload.birthday = new Date(birthday).toISOString();
        payload.userName = userName;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          (isRegister ? "Failed to create account." : "Failed to sign in.");
        setError(message);
        return;
      }

      const token = data?.token as string | undefined;
      const user = data?.user as unknown;

      if (token) {
        window.localStorage.setItem("authToken", token);
      }

      if (user) {
        window.localStorage.setItem("authUser", JSON.stringify(user));
      }

      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Error during auth request", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "register" : "login"));
    setError(null);
  };

  return (
    <main>
      <section className="auth-card">
        <h1 className="auth-title">
          {isRegister ? "Create account" : "Sign in"}
        </h1>
        <p className="auth-subtitle">
          {isRegister
            ? "Start by creating your account."
            : "Sign in to access your account."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label className="auth-field">
              <span>Username</span>
              <input
                type="text"
                name="userName"
                placeholder="yourusername"
                required
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
              />
            </label>
          )}

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

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {isRegister && (
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
          )}

          {isRegister && (
            <label className="auth-field">
              <span>Birthday</span>
              <input
                type="date"
                name="birthday"
                required
                value={birthday}
                onChange={(event) => setBirthday(event.target.value)}
              />
            </label>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting
              ? isRegister
                ? "Creating account..."
                : "Signing in..."
              : isRegister
              ? "Create account"
              : "Sign in"}
          </button>
        </form>

        <button type="button" className="auth-toggle" onClick={toggleMode}>
          {isRegister
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </section>
    </main>
  );
}
