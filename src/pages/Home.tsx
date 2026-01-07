import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "react-router-dom";
import Login from "./Login";
import UserPosts from "../components/UserPosts";
import { getLoggedInUserFromStorage } from "../helpers/auth/authHelpers";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.localStorage.getItem("authToken")
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [canUploadMedia, setCanUploadMedia] = useState(false);
  const [postsRefreshKey, setPostsRefreshKey] = useState(0);
  const [newText, setNewText] = useState("");
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const mediaPreviews = useMemo(() => {
    return newMediaFiles.map((file) => {
      const kind = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
        ? "audio"
        : "file";
      return { file, kind, url: URL.createObjectURL(file) };
    });
  }, [newMediaFiles]);

  useEffect(() => {
    return () => {
      mediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [mediaPreviews]);

  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasToken = !!window.localStorage.getItem("authToken");
    setIsLoggedIn(hasToken);

    if (hasToken) {
      try {
        const me = getLoggedInUserFromStorage();
        setUserId(me?.id ?? null);
        setCanUploadMedia(me?.isCreator === true);
        return;
      } catch {
        // ignore parse errors, userId will remain null
      }
    } else {
      setUserId(null);
      setCanUploadMedia(false);
    }
  }, [location]);

  useEffect(() => {
    if (canUploadMedia) return;
    if (newMediaFiles.length === 0) return;
    setNewMediaFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [canUploadMedia, newMediaFiles.length]);

  useEffect(() => {
    setPostsRefreshKey(0);
  }, [userId]);

  const handleSubmitPost = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoggedIn) return;

    const token = window.localStorage.getItem("authToken");
    if (!token) return;

    const hasMedia = canUploadMedia && newMediaFiles.length > 0;
    if (!newText.trim() && !hasMedia) {
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      if (newText.trim()) {
        formData.append("text", newText.trim());
      }
      if (canUploadMedia && newMediaFiles.length > 0) {
        newMediaFiles.forEach((file) => {
          formData.append("media", file);
        });
      }

      const response = await fetch(`${API_BASE}/users/me/post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to create post.";
        console.error(message);
        return;
      }

      if (data && data.post) {
        setNewText("");
        setNewMediaFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setPostsRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Error creating post", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadMedia) return;
    const files = event.target.files ? Array.from(event.target.files) : [];
    setNewMediaFiles(files);
  };

  const removeMediaAt = (index: number) => {
    setNewMediaFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <main>
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>New Post</h2>
        <form onSubmit={handleSubmitPost} className="auth-form">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="new-post-textarea"
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            {canUploadMedia ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: "48px" }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      ry="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle
                      cx="9"
                      cy="10"
                      r="1.6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M5 17l4-4 3 3 3-3 4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleMediaChange}
                  style={{ display: "none" }}
                  accept="image/*,video/*,audio/*"
                />
              </div>
            ) : null}

            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting}
              style={{ width: "auto", paddingInline: "16px" }}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>

          {canUploadMedia && mediaPreviews.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              {mediaPreviews.map((p, idx) => (
                <div
                  key={`${p.file.name}-${p.file.size}-${idx}`}
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    position: "relative",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.12)",
                  }}
                  title={p.file.name}
                >
                  {p.kind === "image" ? (
                    <img
                      src={p.url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : p.kind === "video" ? (
                    <video
                      src={p.url}
                      muted
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      {p.kind === "audio" ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M9 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                          <path
                            d="M11 16V6l10-2v10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M19 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M14 2v5h5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeMediaAt(idx)}
                    aria-label="Remove attachment"
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "999px",
                      border: "none",
                      cursor: "pointer",
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      lineHeight: "18px",
                      fontSize: "12px",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </form>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <UserPosts key={`feed-${postsRefreshKey}`} feed />
      </section>
    </main>
  );
}
