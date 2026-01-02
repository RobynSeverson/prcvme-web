import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyMessageThreads,
  getUserByUserName,
} from "../helpers/api/apiHelpers";
import type { User } from "../models/user";
import { isUserLoggedIn } from "../helpers/auth/authHelpers";

type ThreadRow = {
  user: User;
  lastText: string;
  lastMessageAt: string;
};

export default function Messages() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isUserLoggedIn());
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  const loginLink = useMemo(() => {
    return `/login?redirect=${encodeURIComponent("/messages")}`;
  }, []);

  useEffect(() => {
    setIsLoggedIn(isUserLoggedIn());
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!isLoggedIn) return;

      try {
        setError(null);
        setIsLoading(true);

        const result = await getMyMessageThreads(undefined, 30);

        const resolved = await Promise.all(
          result.threads.map(async (t) => {
            try {
              const u = await getUserByUserName(t.otherUserId);
              if (!u) return null;
              return {
                user: u,
                lastText: t.lastText,
                lastMessageAt: t.lastMessageAt,
              } as ThreadRow;
            } catch {
              return null;
            }
          })
        );

        setThreads(resolved.filter(Boolean) as ThreadRow[]);
      } catch (err) {
        const message =
          (err instanceof Error && err.message) ||
          "Failed to load message threads.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [isLoggedIn]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (!trimmed) return;
    navigate(`/messages/${encodeURIComponent(trimmed)}`);
  };

  if (!isLoggedIn) {
    return (
      <main>
        <p>You need to log in to view messages.</p>
        <p>
          <Link to={loginLink}>Go to login</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <section style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Messages</h2>
        <form onSubmit={handleSearchSubmit} className="auth-form">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Message a user (username or userId)"
            className="auth-input"
          />
          <button type="submit" className="auth-submit">
            Open
          </button>
        </form>
      </section>

      {error && <p className="auth-error">{error}</p>}

      <section>
        <h3 style={{ marginBottom: "0.5rem" }}>Recent</h3>
        {isLoading ? (
          <p>Loading...</p>
        ) : threads.length === 0 ? (
          <p className="text-muted">No messages yet.</p>
        ) : (
          <div className="app-card" style={{ padding: "0.75rem" }}>
            {threads.map((t) => (
              <div
                key={t.user.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {t.user.displayName || t.user.userName}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                    @{t.user.userName}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                    {t.lastText}
                  </div>
                </div>
                <Link to={`/messages/${encodeURIComponent(t.user.userName)}`}>
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
