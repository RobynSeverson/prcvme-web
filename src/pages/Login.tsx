import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { setTitle } from "../helpers/metadataHelper";

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

  useEffect(() => {
    const cleanup = setTitle("Login • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  const getSafeRedirectPath = (raw: string | null): string | null => {
    if (!raw) return null;

    // Only allow internal paths.
    if (!raw.startsWith("/")) return null;
    if (raw.startsWith("//")) return null;
    if (raw.includes("://")) return null;
    if (raw.startsWith("/login")) return null;
    if (raw.startsWith("/account/login")) return null;

    return raw;
  };

  const redirectPath =
    getSafeRedirectPath(new URLSearchParams(location.search).get("redirect")) ||
    "/me/profile";

  const isRegister = mode === "register";

  const normalizeUserName = (raw: string): string => {
    // Enforce URL-safe username characters: letters, numbers, '.', '_', '-'
    return raw.replace(/\s+/g, "").replace(/[^A-Za-z0-9._-]/g, "");
  };

  const userNameTrimmed = userName.trim();
  const userNameNormalized = normalizeUserName(userNameTrimmed);
  const userNameLengthOk =
    userNameNormalized.length >= 3 && userNameNormalized.length <= 30;
  const userNameFormatOk = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(
    userNameNormalized
  );
  const userNameOk = userNameLengthOk && userNameFormatOk;

  const pw = password;
  const pwMinLenOk = pw.length >= 10;
  const pwMaxLenOk = pw.length <= 128;
  const pwHasLower = /[a-z]/.test(pw);
  const pwHasUpper = /[A-Z]/.test(pw);
  const pwHasNumber = /[0-9]/.test(pw);
  const pwHasSymbol = /[^A-Za-z0-9]/.test(pw);
  const pwNoSpaces = !/\s/.test(pw);
  const passwordOk =
    pwMinLenOk &&
    pwMaxLenOk &&
    pwHasLower &&
    pwHasUpper &&
    pwHasNumber &&
    pwHasSymbol &&
    pwNoSpaces;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (isRegister) {
      if (!userNameOk) {
        setError(
          'Username must be 3-30 characters using only letters, numbers, ".", "_", or "-" (must start/end with a letter/number).'
        );
        return;
      }

      if (!passwordOk) {
        setError(
          "Password must be 10+ characters and include uppercase, lowercase, a number, and a symbol (no spaces)."
        );
        return;
      }

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
        payload.userName = userNameNormalized;
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
                onChange={(event) => {
                  const next = normalizeUserName(event.target.value);
                  setUserName(next);
                }}
              />
              <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                Only letters, numbers, ".", "_", "-" (3–30 chars). Saved as
                lowercase.
                {!userNameOk && userName.length > 0 ? (
                  <span style={{ display: "block", color: "#fca5a5" }}>
                    Must start/end with a letter or number.
                  </span>
                ) : null}
              </div>
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

          {isRegister ? (
            <div
              className="text-muted"
              style={{
                fontSize: "0.85rem",
                marginTop: "-0.25rem",
                marginBottom: "0.5rem",
                lineHeight: 1.35,
              }}
            >
              <div>Password requirements:</div>
              <div style={{ color: pwMinLenOk ? "#86efac" : "#fca5a5" }}>
                • 10+ characters
              </div>
              <div style={{ color: pwHasUpper ? "#86efac" : "#fca5a5" }}>
                • 1 uppercase letter
              </div>
              <div style={{ color: pwHasLower ? "#86efac" : "#fca5a5" }}>
                • 1 lowercase letter
              </div>
              <div style={{ color: pwHasNumber ? "#86efac" : "#fca5a5" }}>
                • 1 number
              </div>
              <div style={{ color: pwHasSymbol ? "#86efac" : "#fca5a5" }}>
                • 1 symbol
              </div>
              <div style={{ color: pwNoSpaces ? "#86efac" : "#fca5a5" }}>
                • No spaces
              </div>
              {!pwMaxLenOk ? (
                <div style={{ color: "#fca5a5" }}>• Max 128 characters</div>
              ) : null}
            </div>
          ) : null}

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

          <button
            type="submit"
            className="auth-submit"
            disabled={
              isSubmitting ||
              (isRegister &&
                (!userNameOk ||
                  !passwordOk ||
                  password !== passwordConfirm ||
                  !birthday))
            }
          >
            {isSubmitting
              ? isRegister
                ? "Creating account..."
                : "Signing in..."
              : isRegister
              ? "Create account"
              : "Sign in"}
          </button>

          {!isRegister && (
            <Link to="/account/forgot-password" className="auth-toggle">
              Forgot password?
            </Link>
          )}
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
