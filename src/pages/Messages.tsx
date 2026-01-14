import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  getMyMessageThreads,
  getMySubscribers,
  getMySubscriptions,
  getUserByUserName,
} from "../helpers/api/apiHelpers";
import type { User } from "../models/user";
import { isUserLoggedIn } from "../helpers/auth/authHelpers";
import { buildProfileImageUrl } from "../helpers/userHelpers";

type ThreadRow = {
  user: User;
  lastText: string;
  lastMessageAt: string;
  isUnread: boolean;
};

export default function Messages() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isUserLoggedIn());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [subscribedUsers, setSubscribedUsers] = useState<User[]>([]);
  const [isLoadingSubscribedUsers, setIsLoadingSubscribedUsers] =
    useState(false);
  const [subscribedUsersError, setSubscribedUsersError] = useState<
    string | null
  >(null);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);

  const navigate = useNavigate();

  const loginLink = useMemo(() => {
    return `/login?redirect=${encodeURIComponent("/messages")}`;
  }, []);

  useEffect(() => {
    setIsLoggedIn(isUserLoggedIn());
  }, []);

  useEffect(() => {
    const loadMe = async () => {
      if (!isLoggedIn) {
        setCurrentUser(null);
        return;
      }

      try {
        const me = await getCurrentUser();
        setCurrentUser(me);
      } catch {
        setCurrentUser(null);
      }
    };

    void loadMe();
  }, [isLoggedIn]);

  useEffect(() => {
    const loadSubscribedUsers = async () => {
      if (!isLoggedIn) {
        setSubscribedUsers([]);
        return;
      }

      try {
        setSubscribedUsersError(null);
        setIsLoadingSubscribedUsers(true);

        if (currentUser?.isCreator === true) {
          const subs = await getMySubscribers({ includeInactive: true });
          const users = (
            subs.map((s) => s.user).filter(Boolean) as User[]
          ).sort((a, b) => {
            const aKey = (a.displayName || a.userName || "").toLowerCase();
            const bKey = (b.displayName || b.userName || "").toLowerCase();
            return aKey.localeCompare(bKey);
          });
          setSubscribedUsers(users);
        } else {
          const subs = await getMySubscriptions();
          const now = new Date();
          const active = subs.filter((s) => {
            const isActive = s.isActive !== false;
            const accessUntil =
              typeof s.accessUntil === "string"
                ? new Date(s.accessUntil)
                : null;
            const hasAccess =
              isActive ||
              (accessUntil instanceof Date &&
                !Number.isNaN(accessUntil.getTime()) &&
                accessUntil.getTime() > now.getTime());
            return hasAccess;
          });

          const uniqueIds = Array.from(
            new Set(active.map((s) => s.subscribedToUserId).filter(Boolean))
          );

          const resolved = await Promise.all(
            uniqueIds.map(async (id) => {
              try {
                const u = await getUserByUserName(id);
                return u ?? null;
              } catch {
                return null;
              }
            })
          );

          const users = (resolved.filter(Boolean) as User[]).sort((a, b) => {
            const aKey = (a.displayName || a.userName || "").toLowerCase();
            const bKey = (b.displayName || b.userName || "").toLowerCase();
            return aKey.localeCompare(bKey);
          });

          setSubscribedUsers(users);
        }
      } catch (err) {
        const message =
          (err instanceof Error && err.message) ||
          (currentUser?.isCreator === true
            ? "Failed to load your subscribers."
            : "Failed to load your subscriptions.");
        setSubscribedUsersError(message);
        setSubscribedUsers([]);
      } finally {
        setIsLoadingSubscribedUsers(false);
      }
    };

    void loadSubscribedUsers();
  }, [isLoggedIn, currentUser?.isCreator]);

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
                isUnread: t.isUnread === true,
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

  const normalizedSearch = search.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!normalizedSearch) return [] as User[];
    const q = normalizedSearch.startsWith("@")
      ? normalizedSearch.slice(1)
      : normalizedSearch;

    const matches = subscribedUsers.filter((u) => {
      const byUserName = (u.userName || "").toLowerCase();
      const byDisplay = (u.displayName || "").toLowerCase();
      const byId = (u.id || "").toLowerCase();
      return byUserName.includes(q) || byDisplay.includes(q) || byId === q;
    });

    return matches.slice(0, 10);
  }, [normalizedSearch, subscribedUsers]);

  const handleSearchSubmit = (e: FormEvent) => {
    // Autocomplete-only: don't allow free-text thread creation.
    e.preventDefault();
    if (suggestions.length === 1) {
      const user = suggestions[0];
      setIsAutocompleteOpen(false);
      navigate(`/messages/${encodeURIComponent(user.userName)}`);
    }
  };

  const handleSelectUser = (user: User) => {
    setSearch(`@${user.userName}`);
    setIsAutocompleteOpen(false);
    navigate(`/messages/${encodeURIComponent(user.userName)}`);
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
        <form onSubmit={handleSearchSubmit} className="auth-form message-form">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsAutocompleteOpen(true);
            }}
            onFocus={() => setIsAutocompleteOpen(true)}
            onBlur={() => {
              // Allow click selection without closing immediately.
              window.setTimeout(() => setIsAutocompleteOpen(false), 150);
            }}
            placeholder={
              currentUser?.isCreator === true
                ? "Start a thread (subscribers only)"
                : "Start a thread (subscribed users only)"
            }
            className="auth-input"
          />
          <button type="submit" className="auth-submit" disabled>
            Open
          </button>
        </form>

        {subscribedUsersError ? (
          <p className="auth-error" style={{ marginTop: "0.5rem" }}>
            {subscribedUsersError}
          </p>
        ) : null}

        {isLoadingSubscribedUsers ? (
          <p className="text-muted" style={{ marginTop: "0.5rem" }}>
            Loading subscribed users...
          </p>
        ) : null}

        {isAutocompleteOpen && normalizedSearch && suggestions.length > 0 ? (
          <div
            className="app-card"
            style={{ marginTop: "0.5rem", padding: "0.5rem" }}
          >
            {suggestions.map((u) => {
              const display = u.displayName || u.userName;
              const avatarSrc = buildProfileImageUrl(u.id, u.profilePictureUrl);

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  className="icon-button"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    justifyContent: "flex-start",
                    padding: "0.5rem",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "999px",
                      overflow: "hidden",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.9)",
                      flex: "0 0 auto",
                      position: "relative",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ position: "absolute" }}
                    >
                      <path
                        d="M20 21a8 8 0 0 0-16 0"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          position: "absolute",
                          inset: 0,
                        }}
                      />
                    ) : null}
                  </span>

                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      lineHeight: 1.2,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{display}</span>
                    <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                      @{u.userName}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {isAutocompleteOpen && normalizedSearch && suggestions.length === 0 ? (
          <p className="text-muted" style={{ marginTop: "0.5rem" }}>
            No subscribed users match that.
          </p>
        ) : null}
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
            {threads.map((t) => {
              const display = t.user.displayName || t.user.userName;
              const avatarSrc = buildProfileImageUrl(
                t.user.id,
                t.user.profilePictureUrl
              );

              const unreadDot = t.isUnread ? (
                <span
                  aria-label="Unread"
                  title="Unread"
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "999px",
                    background: "#4f46e5",
                    boxShadow: "0 0 0 3px rgba(79,70,229,0.18)",
                    flex: "0 0 auto",
                  }}
                />
              ) : null;

              return (
                <div
                  key={t.user.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: t.isUnread
                      ? "rgba(79,70,229,0.10)"
                      : "transparent",
                    borderRadius: t.isUnread ? "0.65rem" : undefined,
                    paddingInline: t.isUnread ? "0.5rem" : undefined,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontWeight: t.isUnread ? 750 : 600,
                      }}
                    >
                      {unreadDot}
                      <span
                        aria-hidden="true"
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "999px",
                          overflow: "hidden",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(255,255,255,0.18)",
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.9)",
                          flex: "0 0 auto",
                          position: "relative",
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ position: "absolute" }}
                        >
                          <path
                            d="M20 21a8 8 0 0 0-16 0"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt=""
                            loading="lazy"
                            draggable={false}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              position: "absolute",
                              inset: 0,
                            }}
                          />
                        ) : null}
                      </span>

                      <span>{display}</span>
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
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
