import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { isUserLoggedIn } from "../helpers/auth/authHelpers";
import Lightbox from "../components/Lightbox";
import { setTitle } from "../helpers/metadataHelper";
import styles from "./Admin.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type AdminUserRow = {
  id: string;
  userName: string;
  displayName?: string;
  email: string;
  isCreator: boolean;
  isAdmin: boolean;
  isActive: boolean;
};

type CreatorRequestRow = {
  id: string;
  userId: string;
  userName?: string;
  displayName?: string;
  email?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  rejectionReason?: string;
};

export default function Admin() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const [pendingCreatorRequests, setPendingCreatorRequests] = useState<
    CreatorRequestRow[]
  >([]);
  const [isCreatorRequestsLoading, setIsCreatorRequestsLoading] =
    useState(false);
  const [creatorRequestsError, setCreatorRequestsError] = useState<
    string | null
  >(null);
  const [creatorRequestImageUrls, setCreatorRequestImageUrls] = useState<
    Record<string, { document?: string; holdingDocument?: string }>
  >({});
  const [creatorRequestImageLoading, setCreatorRequestImageLoading] = useState<
    Record<string, boolean>
  >({});

  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    request?: CreatorRequestRow;
    reason: string;
    isSubmitting: boolean;
    error: string | null;
  }>({ isOpen: false, reason: "", isSubmitting: false, error: null });

  const location = useLocation();
  const loginLink = useMemo(
    () =>
      `/account/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`,
    [location.pathname, location.search]
  );

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("authToken")
      : null;

  const isAdmin = useMemo(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem("authUser")
          : null;
      const parsed = raw ? (JSON.parse(raw) as { isAdmin?: boolean }) : null;
      return Boolean(parsed && parsed.isAdmin === true);
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const cleanup = setTitle("Admin • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!isUserLoggedIn()) {
      setError("You need to be signed in to view admin tools.");
      return;
    }
    if (!isAdmin) {
      setError("Admin access required.");
      return;
    }
  }, [isAdmin]);

  const loadPendingCreatorRequests = async () => {
    setCreatorRequestsError(null);

    if (!token) {
      setCreatorRequestsError("You need to be signed in to view admin tools.");
      return;
    }
    if (!isAdmin) {
      setCreatorRequestsError("Admin access required.");
      return;
    }

    setIsCreatorRequestsLoading(true);
    try {
      const url = new URL(`${API_BASE}/admin/creator-requests`);
      url.searchParams.set("status", "pending");
      url.searchParams.set("limit", "100");

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to load creator requests.";
        setCreatorRequestsError(message);
        return;
      }

      const requests =
        data && Array.isArray(data.requests)
          ? (data.requests as CreatorRequestRow[])
          : [];
      setPendingCreatorRequests(requests);
    } catch (err) {
      console.error("Error loading creator requests", err);
      setCreatorRequestsError("Something went wrong while loading requests.");
    } finally {
      setIsCreatorRequestsLoading(false);
    }
  };

  const fetchCreatorRequestImage = async (
    requestId: string,
    type: "document" | "holdingDocument"
  ) => {
    if (!token) throw new Error("Not signed in.");

    const response = await fetch(
      `${API_BASE}/admin/creator-requests/${requestId}/identity/${type}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load image.");
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  const ensureCreatorRequestImages = async (requestId: string) => {
    if (creatorRequestImageLoading[requestId]) return;
    if (
      creatorRequestImageUrls[requestId]?.document &&
      creatorRequestImageUrls[requestId]?.holdingDocument
    ) {
      return;
    }

    setCreatorRequestImageLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const [docUrl, holdingUrl] = await Promise.all([
        fetchCreatorRequestImage(requestId, "document"),
        fetchCreatorRequestImage(requestId, "holdingDocument"),
      ]);

      setCreatorRequestImageUrls((prev) => {
        const existing = prev[requestId];
        if (existing?.document) URL.revokeObjectURL(existing.document);
        if (existing?.holdingDocument)
          URL.revokeObjectURL(existing.holdingDocument);
        return {
          ...prev,
          [requestId]: { document: docUrl, holdingDocument: holdingUrl },
        };
      });
    } finally {
      setCreatorRequestImageLoading((prev) => ({
        ...prev,
        [requestId]: false,
      }));
    }
  };

  const approveRequest = async (requestId: string) => {
    if (!token) return;

    const updateKey = `${requestId}:approve`;
    setIsUpdating((prev) => ({ ...prev, [updateKey]: true }));
    setCreatorRequestsError(null);
    try {
      const response = await fetch(
        `${API_BASE}/admin/creator-requests/${requestId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to approve request.";
        setCreatorRequestsError(message);
        return;
      }

      // Remove from pending list.
      setPendingCreatorRequests((prev) =>
        prev.filter((r) => r.id !== requestId)
      );
    } catch (err) {
      console.error("Error approving creator request", err);
      setCreatorRequestsError("Something went wrong while approving.");
    } finally {
      setIsUpdating((prev) => ({ ...prev, [updateKey]: false }));
    }
  };

  const submitReject = async () => {
    if (!token || !rejectModal.request) return;
    const requestId = rejectModal.request.id;
    const trimmed = rejectModal.reason.trim();
    if (!trimmed) {
      setRejectModal((prev) => ({ ...prev, error: "Reason is required." }));
      return;
    }

    setRejectModal((prev) => ({ ...prev, isSubmitting: true, error: null }));
    try {
      const response = await fetch(
        `${API_BASE}/admin/creator-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: trimmed }),
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to reject request.";
        setRejectModal((prev) => ({ ...prev, error: message }));
        return;
      }

      setPendingCreatorRequests((prev) =>
        prev.filter((r) => r.id !== requestId)
      );
      setRejectModal({
        isOpen: false,
        reason: "",
        isSubmitting: false,
        error: null,
      });
    } catch (err) {
      console.error("Error rejecting creator request", err);
      setRejectModal((prev) => ({
        ...prev,
        error: "Something went wrong while rejecting.",
      }));
    } finally {
      setRejectModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  useEffect(() => {
    if (!isUserLoggedIn() || !isAdmin) return;
    if (!token) return;
    void loadPendingCreatorRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    return () => {
      // Cleanup any blob URLs.
      Object.values(creatorRequestImageUrls).forEach((pair) => {
        if (pair.document) URL.revokeObjectURL(pair.document);
        if (pair.holdingDocument) URL.revokeObjectURL(pair.holdingDocument);
      });
    };
  }, [creatorRequestImageUrls]);

  const search = async () => {
    setError(null);

    if (!token) {
      setError("You need to be signed in to view admin tools.");
      return;
    }

    if (!isAdmin) {
      setError("Admin access required.");
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const url = new URL(`${API_BASE}/admin/users`);
      url.searchParams.set("query", trimmed);
      url.searchParams.set("limit", "20");

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to search users.";
        setError(message);
        return;
      }

      const users =
        data && Array.isArray(data.users) ? (data.users as AdminUserRow[]) : [];
      setResults(users);
    } catch (err) {
      console.error("Error searching users", err);
      setError("Something went wrong while searching users.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCreator = async (user: AdminUserRow) => {
    if (!token) return;

    const updateKey = `${user.id}:creator`;
    setIsUpdating((prev) => ({ ...prev, [updateKey]: true }));
    try {
      const response = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isCreator: !user.isCreator }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to update user.";
        setError(message);
        return;
      }

      const updated = data && data.user ? (data.user as AdminUserRow) : null;
      if (!updated) {
        setError("Failed to update user.");
        return;
      }

      setResults((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (err) {
      console.error("Error updating user", err);
      setError("Something went wrong while updating the user.");
    } finally {
      setIsUpdating((prev) => ({ ...prev, [updateKey]: false }));
    }
  };

  const toggleActive = async (user: AdminUserRow) => {
    if (!token) return;

    const updateKey = `${user.id}:active`;
    setIsUpdating((prev) => ({ ...prev, [updateKey]: true }));
    try {
      const response = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to update user.";
        setError(message);
        return;
      }

      const updated = data && data.user ? (data.user as AdminUserRow) : null;
      if (!updated) {
        setError("Failed to update user.");
        return;
      }

      setResults((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (err) {
      console.error("Error updating user", err);
      setError("Something went wrong while updating the user.");
    } finally {
      setIsUpdating((prev) => ({ ...prev, [updateKey]: false }));
    }
  };

  if (!isUserLoggedIn()) {
    return (
      <main>
        <h1>Admin</h1>
        <p className="auth-error">You need to be signed in.</p>
        <p>
          <Link to={loginLink}>Go to login</Link>
        </p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main>
        <h1>Admin</h1>
        <p className="auth-error">Admin access required.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Admin</h1>

      <section
        className="app-card"
        style={{ padding: "1rem", marginBottom: "1rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ marginTop: 0, marginBottom: "0.25rem" }}>
              Pending creator requests
            </h2>
            <p className="text-muted" style={{ marginTop: 0 }}>
              Review identity images, then approve or reject.
            </p>
          </div>

          <button
            type="button"
            className="auth-submit"
            onClick={() => {
              void loadPendingCreatorRequests();
            }}
            style={{ width: "auto" }}
            disabled={isCreatorRequestsLoading}
          >
            {isCreatorRequestsLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {creatorRequestsError ? (
          <p className="auth-error">{creatorRequestsError}</p>
        ) : null}

        {pendingCreatorRequests.length === 0 && !isCreatorRequestsLoading ? (
          <p className="text-muted" style={{ marginBottom: 0 }}>
            No pending creator requests.
          </p>
        ) : null}

        {pendingCreatorRequests.length > 0 ? (
          <div
            style={{ marginTop: "0.75rem", display: "grid", gap: "0.75rem" }}
          >
            {pendingCreatorRequests.map((r) => {
              const display =
                r.displayName || r.userName || r.email || r.userId;
              const userLabel = r.userName ? `@${r.userName}` : r.userId;
              const imagePair = creatorRequestImageUrls[r.id];
              const isImgLoading = Boolean(creatorRequestImageLoading[r.id]);

              return (
                <details
                  key={r.id}
                  className="app-card"
                  style={{ padding: "0.85rem" }}
                  onToggle={(e) => {
                    const el = e.currentTarget;
                    if (el.open) {
                      void ensureCreatorRequestImages(r.id).catch((err) => {
                        console.error("Failed loading identity images", err);
                        setCreatorRequestsError(
                          "Failed to load identity images."
                        );
                      });
                    }
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{display}</div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {userLabel} • submitted{" "}
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                      {isImgLoading ? "Loading images..." : "View"}
                    </span>
                  </summary>

                  <div
                    style={{
                      marginTop: "0.75rem",
                      display: "grid",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "0.75rem",
                      }}
                    >
                      <div>
                        <div
                          className="text-muted"
                          style={{ marginBottom: "0.35rem" }}
                        >
                          Document
                        </div>
                        {imagePair?.document ? (
                          <img
                            src={imagePair.document}
                            alt="Identity document"
                            style={{
                              width: "100%",
                              maxHeight: "420px",
                              objectFit: "contain",
                              borderRadius: "0.75rem",
                              border: "1px solid var(--border-color)",
                              background: "rgba(0,0,0,0.2)",
                            }}
                          />
                        ) : (
                          <div className="text-muted">
                            {isImgLoading ? "Loading..." : "Not loaded"}
                          </div>
                        )}
                      </div>

                      <div>
                        <div
                          className="text-muted"
                          style={{ marginBottom: "0.35rem" }}
                        >
                          Holding document
                        </div>
                        {imagePair?.holdingDocument ? (
                          <img
                            src={imagePair.holdingDocument}
                            alt="Holding identity document"
                            style={{
                              width: "100%",
                              maxHeight: "420px",
                              objectFit: "contain",
                              borderRadius: "0.75rem",
                              border: "1px solid var(--border-color)",
                              background: "rgba(0,0,0,0.2)",
                            }}
                          />
                        ) : (
                          <div className="text-muted">
                            {isImgLoading ? "Loading..." : "Not loaded"}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => {
                          setRejectModal({
                            isOpen: true,
                            request: r,
                            reason: "",
                            isSubmitting: false,
                            error: null,
                          });
                        }}
                        disabled={Boolean(isUpdating[`${r.id}:approve`])}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="auth-submit"
                        onClick={() => {
                          void approveRequest(r.id);
                        }}
                        disabled={Boolean(isUpdating[`${r.id}:approve`])}
                        style={{ width: "auto", marginTop: 0 }}
                      >
                        {isUpdating[`${r.id}:approve`]
                          ? "Approving..."
                          : "Approve"}
                      </button>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="app-card" style={{ padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>User search</h2>
        <p className="text-muted" style={{ marginTop: 0 }}>
          Search by username, display name, or email.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
          className="auth-form message-form"
        >
          <input
            type="text"
            className="auth-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            aria-label="Search users"
          />
          <button type="submit" className="auth-submit">
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {error ? <p className="auth-error">{error}</p> : null}

        {results.length > 0 ? (
          <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
            {results.map((u) => (
              <div key={u.id} className={`app-card ${styles.userRow}`}>
                <div className="admin-user-info">
                  <div className={styles.userTitle}>
                    {u.displayName || u.userName}{" "}
                    <Link
                      to={`/${encodeURIComponent(u.userName)}`}
                      className="text-muted"
                    >
                      @{u.userName}
                    </Link>
                  </div>
                  <div className={`${styles.userMeta} text-muted`}>
                    {u.email}
                    {u.isAdmin ? " • admin" : ""}
                    {!u.isActive ? " • inactive" : ""}
                  </div>
                </div>

                <div
                  className={`${styles.userActions} ${styles.actionsDesktop}`}
                >
                  <span className={`${styles.userStatus} text-muted`}>
                    {u.isCreator ? "Creator" : "Viewer"} •{" "}
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    type="button"
                    className="auth-toggle"
                    disabled={Boolean(isUpdating[`${u.id}:creator`])}
                    onClick={() => {
                      setError(null);
                      void toggleCreator(u);
                    }}
                    style={{ marginTop: 0 }}
                  >
                    {isUpdating[`${u.id}:creator`]
                      ? "Updating..."
                      : u.isCreator
                      ? "Remove creator"
                      : "Make creator"}
                  </button>

                  <button
                    type="button"
                    className="auth-toggle"
                    disabled={Boolean(isUpdating[`${u.id}:active`])}
                    onClick={() => {
                      setError(null);
                      void toggleActive(u);
                    }}
                    style={{ marginTop: 0 }}
                  >
                    {isUpdating[`${u.id}:active`]
                      ? "Updating..."
                      : u.isActive
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </div>

                <details
                  className={`${styles.userActions} ${styles.actionsMobile}`}
                >
                  <summary>Options</summary>
                  <div className={styles.actionsBody}>
                    <span className={`${styles.userStatus} text-muted`}>
                      {u.isCreator ? "Creator" : "Viewer"} •{" "}
                      {u.isActive ? "Active" : "Inactive"}
                    </span>

                    <button
                      type="button"
                      className={`auth-toggle ${styles.toggleButton}`}
                      disabled={Boolean(isUpdating[`${u.id}:creator`])}
                      onClick={() => {
                        setError(null);
                        void toggleCreator(u);
                      }}
                      style={{ marginTop: 0 }}
                    >
                      {isUpdating[`${u.id}:creator`]
                        ? "Updating..."
                        : u.isCreator
                        ? "Remove creator"
                        : "Make creator"}
                    </button>

                    <button
                      type="button"
                      className={`auth-toggle ${styles.toggleButton}`}
                      disabled={Boolean(isUpdating[`${u.id}:active`])}
                      onClick={() => {
                        setError(null);
                        void toggleActive(u);
                      }}
                      style={{ marginTop: 0 }}
                    >
                      {isUpdating[`${u.id}:active`]
                        ? "Updating..."
                        : u.isActive
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>
                </details>
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && query.trim() && results.length === 0 ? (
          <p className="text-muted" style={{ marginTop: "1rem" }}>
            No users found.
          </p>
        ) : null}
      </section>

      <Lightbox
        isOpen={rejectModal.isOpen}
        onClose={() => {
          if (rejectModal.isSubmitting) return;
          setRejectModal({
            isOpen: false,
            reason: "",
            isSubmitting: false,
            error: null,
          });
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
            Reject creator request
          </h3>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Provide a reason the user will see.
          </p>

          <textarea
            className="auth-input"
            value={rejectModal.reason}
            onChange={(e) =>
              setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
            }
            rows={5}
            placeholder="Reason..."
            style={{ width: "100%", resize: "vertical" }}
            disabled={rejectModal.isSubmitting}
          />

          {rejectModal.error ? (
            <p className="auth-error">{rejectModal.error}</p>
          ) : null}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
              marginTop: "0.75rem",
            }}
          >
            <button
              type="button"
              className="icon-button"
              onClick={() =>
                setRejectModal({
                  isOpen: false,
                  reason: "",
                  isSubmitting: false,
                  error: null,
                })
              }
              disabled={rejectModal.isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="auth-submit"
              onClick={() => {
                void submitReject();
              }}
              disabled={rejectModal.isSubmitting}
              style={{ width: "auto", marginTop: 0 }}
            >
              {rejectModal.isSubmitting ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </div>
      </Lightbox>
    </main>
  );
}
