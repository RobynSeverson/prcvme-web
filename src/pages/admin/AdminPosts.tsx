import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Lightbox from "../../components/Lightbox";
import SecureImage from "../../components/SecureImage";
import SecureVideo from "../../components/SecureVideo";
import { setTitle } from "../../helpers/metadataHelper";
import { buildMediaUrl } from "../../helpers/userHelpers";
import { useCurrentUser } from "../../context/CurrentUserContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type PendingPostRow = {
  id: string;
  userId: string;
  creatorUserName: string;
  creatorDisplayName?: string;
  text?: string;
  mediaCount: number;
  mediaItems: { mediaKey: string; mediaType: string }[];
  createdAt: string;
  reviewStatus: string;
};

export default function AdminPosts() {
  const { user: currentUser, isAuthenticated, authedFetch } = useCurrentUser();
  const isAdmin = currentUser?.isAdmin === true;

  const [posts, setPosts] = useState<PendingPostRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    post?: PendingPostRow;
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

  useEffect(() => {
    const cleanup = setTitle("Admin – Pending Posts • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  const loadPosts = async () => {
    setError(null);

    if (!isAuthenticated) {
      setError("You need to be signed in to view admin tools.");
      return;
    }
    if (!isAdmin) {
      setError("Admin access required.");
      return;
    }

    setIsLoading(true);
    try {
      const url = new URL(`${API_BASE}/admin/posts`);
      url.searchParams.set("reviewStatus", "pending");
      url.searchParams.set("limit", "100");

      const response = await authedFetch(url.toString(), { requireAuth: true });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to load pending posts.";
        setError(message);
        return;
      }

      const rows =
        data && Array.isArray(data.posts) ? (data.posts as PendingPostRow[]) : [];
      setPosts(rows);
    } catch (err) {
      console.error("Error loading pending posts", err);
      setError("Something went wrong while loading posts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isAuthenticated]);

  const approvePost = async (postId: string) => {
    if (!isAuthenticated || !isAdmin) return;

    setIsUpdating((prev) => ({ ...prev, [`${postId}:approve`]: true }));
    setError(null);
    try {
      const response = await authedFetch(
        `${API_BASE}/admin/posts/${postId}/approve`,
        { method: "POST", requireAuth: true }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to approve post.";
        setError(message);
        return;
      }

      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Error approving post", err);
      setError("Something went wrong while approving.");
    } finally {
      setIsUpdating((prev) => ({ ...prev, [`${postId}:approve`]: false }));
    }
  };

  const submitReject = async () => {
    if (!isAuthenticated || !isAdmin || !rejectModal.post) return;
    const postId = rejectModal.post.id;
    const trimmed = rejectModal.reason.trim();
    if (!trimmed) {
      setRejectModal((prev) => ({ ...prev, error: "Reason is required." }));
      return;
    }

    setRejectModal((prev) => ({ ...prev, isSubmitting: true, error: null }));
    try {
      const response = await authedFetch(
        `${API_BASE}/admin/posts/${postId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: trimmed }),
          requireAuth: true,
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to reject post.";
        setRejectModal((prev) => ({ ...prev, error: message }));
        return;
      }

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setRejectModal({ isOpen: false, reason: "", isSubmitting: false, error: null });
    } catch (err) {
      console.error("Error rejecting post", err);
      setRejectModal((prev) => ({
        ...prev,
        error: "Something went wrong while rejecting.",
      }));
    } finally {
      setRejectModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  if (!isAuthenticated) {
    return (
      <main>
        <h1>Admin – Pending Posts</h1>
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
        <h1>Admin – Pending Posts</h1>
        <p className="auth-error">Admin access required.</p>
      </main>
    );
  }

  return (
    <main>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "0.5rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Pending Posts</h1>
        <Link to="/portal/admin" className="text-muted" style={{ fontSize: "0.9rem" }}>
          ← Back to Admin
        </Link>
      </div>

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
            marginBottom: "0.75rem",
          }}
        >
          <p className="text-muted" style={{ margin: 0 }}>
            Review posts from creators who don't have skip-review enabled.
          </p>
          <button
            type="button"
            className="auth-submit"
            onClick={() => {
              void loadPosts();
            }}
            style={{ width: "auto" }}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        {posts.length === 0 && !isLoading ? (
          <p className="text-muted" style={{ marginBottom: 0 }}>
            No pending posts.
          </p>
        ) : null}

        {posts.length > 0 ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {posts.map((post) => {
              const display =
                post.creatorDisplayName || post.creatorUserName || post.userId;
              const userLabel = post.creatorUserName
                ? `@${post.creatorUserName}`
                : post.userId;

              return (
                <div
                  key={post.id}
                  className="app-card"
                  style={{ padding: "0.85rem" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{display}</div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.9rem", marginBottom: "0.4rem" }}
                      >
                        {userLabel} •{" "}
                        {new Date(post.createdAt).toLocaleString()} •{" "}
                        {post.mediaCount} media item
                        {post.mediaCount !== 1 ? "s" : ""}
                      </div>
                      {post.text ? (
                        <p
                          style={{
                            margin: "0 0 0.4rem",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {post.text}
                        </p>
                      ) : null}
                      {post.mediaItems.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                            marginTop: "0.5rem",
                          }}
                        >
                          {post.mediaItems.map((item) => {
                            const src = buildMediaUrl(post.userId, item.mediaKey);
                            if (item.mediaType === "video") {
                              return (
                                <SecureVideo
                                  key={item.mediaKey}
                                  src={src}
                                  style={{ maxHeight: 200, maxWidth: "100%", borderRadius: "0.5rem" }}
                                />
                              );
                            }
                            if (item.mediaType === "image") {
                              return (
                                <SecureImage
                                  key={item.mediaKey}
                                  src={src}
                                  alt=""
                                  style={{ maxHeight: 200, maxWidth: "100%", borderRadius: "0.5rem", objectFit: "cover" }}
                                />
                              );
                            }
                            return (
                              <span key={item.mediaKey} className="text-muted" style={{ fontSize: "0.85rem" }}>
                                [{item.mediaType}]
                              </span>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexShrink: 0,
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() =>
                          setRejectModal({
                            isOpen: true,
                            post,
                            reason: "",
                            isSubmitting: false,
                            error: null,
                          })
                        }
                        disabled={Boolean(isUpdating[`${post.id}:approve`])}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="auth-submit"
                        onClick={() => {
                          void approvePost(post.id);
                        }}
                        disabled={Boolean(isUpdating[`${post.id}:approve`])}
                        style={{ width: "auto", marginTop: 0 }}
                      >
                        {isUpdating[`${post.id}:approve`]
                          ? "Approving..."
                          : "Approve"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Reject post</h3>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Provide a reason for the rejection.
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
