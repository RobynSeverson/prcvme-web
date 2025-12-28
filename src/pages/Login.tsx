import { useState } from "react";
import type { FormEvent } from "react";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");

  const isRegister = mode === "register";

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "register" : "login"));
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
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
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
              />
            </label>
          )}

          <button type="submit" className="auth-submit">
            {isRegister ? "Create account" : "Sign in"}
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
