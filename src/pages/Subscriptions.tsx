import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Lightbox from "../components/Lightbox";
import {
  getCurrentUser,
  getMySubscribers,
  getMySubscriptions,
  getUserByUserName,
  unsubscribeFromUser,
} from "../helpers/api/apiHelpers";
import { isUserLoggedIn } from "../helpers/auth/authHelpers";
import { buildProfileImageUrl } from "../helpers/userHelpers";
import type { User } from "../models/user";

type SubscriptionRow = {
  subscribedToUserId: string;
  isActive: boolean;
  createdAt: string;
  accessUntil?: string;
  user: User | null;
};

type SubscriberRow = {
  subscriberUserId: string;
  isActive: boolean;
  createdAt: string;
  accessUntil?: string;
  user: User | null;
};

export default function Subscriptions() {
  const [isLoggedIn] = useState(() => isUserLoggedIn());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [subscriberRows, setSubscriberRows] = useState<SubscriberRow[]>([]);
  const [isSubscribersLoading, setIsSubscribersLoading] = useState(false);
  const [subscribersError, setSubscribersError] = useState<string | null>(null);

  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<SubscriptionRow | null>(
    null
  );
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const navigate = useNavigate();

  const loginLink = useMemo(() => {
    return `/login?redirect=${encodeURIComponent("/subscriptions")}`;
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!isLoggedIn) return;

      try {
        // Load current user (needed to decide whether to render Subscribers section).
        try {
          const me = await getCurrentUser();
          setCurrentUser(me);
        } catch {
          // Non-fatal; page can still show subscriptions.
          setCurrentUser(null);
        }

        setError(null);
        setIsLoading(true);

        const subs = await getMySubscriptions();
        const normalized = subs
          .map((s) => ({
            subscribedToUserId: s.subscribedToUserId,
            isActive: s.isActive !== false,
            createdAt: s.createdAt,
            accessUntil:
              typeof s.accessUntil === "string" ? s.accessUntil : undefined,
          }))
          .filter((s) => typeof s.subscribedToUserId === "string");

        const uniqueIds = Array.from(
          new Set(normalized.map((s) => s.subscribedToUserId))
        );

        const resolvedUsers = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const u = await getUserByUserName(id);
              return [id, u] as const;
            } catch {
              return [id, null] as const;
            }
          })
        );

        const userMap = new Map<string, User | null>(resolvedUsers);

        const nextRows: SubscriptionRow[] = normalized
          .map((s) => ({
            ...s,
            user: userMap.get(s.subscribedToUserId) ?? null,
          }))
          .sort((a, b) => {
            const aKey = (
              a.user?.displayName ||
              a.user?.userName ||
              ""
            ).toLowerCase();
            const bKey = (
              b.user?.displayName ||
              b.user?.userName ||
              ""
            ).toLowerCase();
            return aKey.localeCompare(bKey);
          });

        setRows(nextRows);
      } catch (err) {
        const message =
          (err instanceof Error && err.message) ||
          "Failed to load subscriptions.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [isLoggedIn]);

  useEffect(() => {
    const loadSubscribers = async () => {
      if (!isLoggedIn) return;
      if (currentUser?.isCreator !== true) return;

      try {
        setSubscribersError(null);
        setIsSubscribersLoading(true);

        const subs = await getMySubscribers();
        const normalized = subs
          .map((s) => ({
            subscriberUserId: s.subscriberUserId,
            isActive: s.isActive !== false,
            createdAt: s.createdAt,
            accessUntil:
              typeof s.accessUntil === "string" ? s.accessUntil : undefined,
            user: s.user ?? null,
          }))
          .filter((s) => typeof s.subscriberUserId === "string");

        const nextRows: SubscriberRow[] = normalized.sort((a, b) => {
          const aKey = (
            a.user?.displayName ||
            a.user?.userName ||
            ""
          ).toLowerCase();
          const bKey = (
            b.user?.displayName ||
            b.user?.userName ||
            ""
          ).toLowerCase();
          return aKey.localeCompare(bKey);
        });

        setSubscriberRows(nextRows);
      } catch (err) {
        const message =
          (err instanceof Error && err.message) ||
          "Failed to load subscribers.";
        setSubscribersError(message);
      } finally {
        setIsSubscribersLoading(false);
      }
    };

    void loadSubscribers();
  }, [isLoggedIn, currentUser?.isCreator]);

  if (!isLoggedIn) {
    return (
      <main>
        <p>You need to log in to view subscriptions.</p>
        <p>
          <Link to={loginLink}>Go to login</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      {currentUser?.isCreator ? (
        <>
          <section style={{ marginBottom: "1rem" }}>
            <h2 style={{ marginBottom: "0.5rem" }}>Subscribers</h2>
            <p className="text-muted" style={{ marginTop: 0 }}>
              People currently subscribed to you (including paid-through
              cancellations).
            </p>
          </section>

          {subscribersError ? (
            <p className="auth-error">{subscribersError}</p>
          ) : null}

          <section style={{ marginBottom: "1.25rem" }}>
            {isSubscribersLoading ? (
              <p>Loading...</p>
            ) : subscriberRows.length === 0 ? (
              <div className="app-card" style={{ padding: "0.75rem" }}>
                <p className="text-muted" style={{ margin: 0 }}>
                  You don’t have any subscribers yet.
                </p>
              </div>
            ) : (
              <div className="app-card" style={{ padding: "0.75rem" }}>
                {subscriberRows.map((r) => {
                  const display =
                    r.user?.displayName || r.user?.userName || "Subscriber";
                  const userName = r.user?.userName;
                  const avatarSrc = r.user
                    ? buildProfileImageUrl(r.user.id, r.user.profilePictureUrl)
                    : null;

                  const now = new Date();
                  const accessUntilDate = r.accessUntil
                    ? new Date(r.accessUntil)
                    : null;
                  const hasAccess =
                    r.isActive ||
                    (accessUntilDate instanceof Date &&
                      !Number.isNaN(accessUntilDate.getTime()) &&
                      accessUntilDate.getTime() > now.getTime());

                  const statusText = r.isActive
                    ? "Active"
                    : hasAccess && accessUntilDate
                    ? `Cancelled • active until ${accessUntilDate.toLocaleDateString()}`
                    : "Inactive";

                  return (
                    <div
                      key={r.subscriberUserId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.6rem 0",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        gap: "0.75rem",
                      }}
                    >
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => {
                          if (userName) {
                            navigate(`/${encodeURIComponent(userName)}`);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          justifyContent: "flex-start",
                          padding: 0,
                          flex: "1 1 auto",
                          textAlign: "left",
                          minWidth: 0,
                        }}
                        disabled={!userName}
                        title={
                          userName ? "View profile" : "Profile unavailable"
                        }
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: "44px",
                            height: "44px",
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

                        <span
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {display}
                          </span>
                          {userName ? (
                            <span
                              className="text-muted"
                              style={{ fontSize: "0.9rem" }}
                            >
                              @{userName}
                            </span>
                          ) : null}
                          <span
                            className="text-muted"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {statusText}
                          </span>
                        </span>
                      </button>

                      <div style={{ flex: "0 0 auto" }}>
                        <button
                          type="button"
                          className="auth-submit"
                          disabled={!userName}
                          style={{ width: "auto", marginTop: 0 }}
                          onClick={() => {
                            if (!userName) return;
                            navigate(
                              `/messages/${encodeURIComponent(userName)}`
                            );
                          }}
                          title={userName ? "Chat" : "Subscriber unavailable"}
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}

      <section style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Subscriptions</h2>
        <p className="text-muted" style={{ marginTop: 0 }}>
          Manage your creator subscriptions (including paid-through
          cancellations).
        </p>
      </section>

      {error && <p className="auth-error">{error}</p>}

      <section>
        {isLoading ? (
          <p>Loading...</p>
        ) : rows.length === 0 ? (
          <div className="app-card" style={{ padding: "0.75rem" }}>
            <p className="text-muted" style={{ margin: 0 }}>
              You don’t have any subscriptions yet.
            </p>
          </div>
        ) : (
          <div className="app-card" style={{ padding: "0.75rem" }}>
            {rows.map((r) => {
              const display =
                r.user?.displayName || r.user?.userName || r.subscribedToUserId;
              const userName = r.user?.userName;
              const avatarSrc = r.user
                ? buildProfileImageUrl(r.user.id, r.user.profilePictureUrl)
                : null;

              const now = new Date();
              const accessUntilDate = r.accessUntil
                ? new Date(r.accessUntil)
                : null;
              const hasAccess =
                r.isActive ||
                (accessUntilDate instanceof Date &&
                  !Number.isNaN(accessUntilDate.getTime()) &&
                  accessUntilDate.getTime() > now.getTime());

              const statusText = r.isActive
                ? "Active"
                : hasAccess && accessUntilDate
                ? `Cancelled • active until ${accessUntilDate.toLocaleDateString()}`
                : "Inactive";

              return (
                <div
                  key={r.subscribedToUserId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => {
                      if (userName) {
                        navigate(`/${encodeURIComponent(userName)}`);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      justifyContent: "flex-start",
                      padding: 0,
                      width: "100%",
                      textAlign: "left",
                      minWidth: 0,
                    }}
                    disabled={!userName}
                    title={userName ? "View profile" : "Profile unavailable"}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "44px",
                        height: "44px",
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

                    <span
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {display}
                      </span>
                      {userName ? (
                        <span
                          className="text-muted"
                          style={{ fontSize: "0.9rem" }}
                        >
                          @{userName}
                        </span>
                      ) : (
                        <span
                          className="text-muted"
                          style={{ fontSize: "0.9rem" }}
                        >
                          User unavailable
                        </span>
                      )}
                      {statusText ? (
                        <span
                          className="text-muted"
                          style={{ fontSize: "0.85rem" }}
                        >
                          {statusText}
                        </span>
                      ) : null}
                    </span>
                  </button>

                  <div style={{ flex: "0 0 auto" }}>
                    <button
                      type="button"
                      className="auth-submit"
                      disabled={!r.isActive}
                      style={{ width: "auto", marginTop: 0 }}
                      onClick={() => {
                        setConfirmError(null);
                        setConfirmTarget(r);
                        setConfirmOpen(true);
                      }}
                    >
                      {r.isActive ? "Unsubscribe" : "Cancelled"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Lightbox
        isOpen={confirmOpen}
        onClose={() => {
          if (isUnsubscribing) return;
          setConfirmOpen(false);
        }}
        zIndex={2500}
      >
        <div
          className="app-card"
          style={{
            width: "min(520px, 100%)",
            padding: "1.25rem",
            borderRadius: "1rem",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
            Cancel subscription?
          </h3>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Are you sure you want to unsubscribe?
          </p>

          {confirmTarget?.user?.userName ? (
            <p style={{ marginTop: 0 }}>
              Creator: <strong>@{confirmTarget.user.userName}</strong>
            </p>
          ) : null}

          {confirmError ? <p className="auth-error">{confirmError}</p> : null}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <button
              type="button"
              className="icon-button"
              onClick={() => setConfirmOpen(false)}
              disabled={isUnsubscribing}
            >
              Keep
            </button>
            <button
              type="button"
              className="auth-submit"
              onClick={async () => {
                if (!confirmTarget) return;
                if (isUnsubscribing) return;

                try {
                  setConfirmError(null);
                  setIsUnsubscribing(true);

                  await unsubscribeFromUser(confirmTarget.subscribedToUserId);

                  setRows((prev) =>
                    prev.map((r) =>
                      r.subscribedToUserId === confirmTarget.subscribedToUserId
                        ? { ...r, isActive: false }
                        : r
                    )
                  );

                  setConfirmOpen(false);
                } catch (err) {
                  const message =
                    (err instanceof Error && err.message) ||
                    "Failed to unsubscribe.";
                  setConfirmError(message);
                } finally {
                  setIsUnsubscribing(false);
                }
              }}
              disabled={isUnsubscribing}
              style={{ width: "auto", marginTop: 0 }}
            >
              {isUnsubscribing ? "Unsubscribing..." : "Unsubscribe"}
            </button>
          </div>
        </div>
      </Lightbox>
    </main>
  );
}
