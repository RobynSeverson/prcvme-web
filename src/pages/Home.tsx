import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "react-router-dom";
import Login from "./Login";
import UserPosts from "../components/UserPosts";
import SVG from "../assets/image.svg";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.localStorage.getItem("authToken")
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [newMediaFiles, setNewMediaFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasToken = !!window.localStorage.getItem("authToken");
    setIsLoggedIn(hasToken);

    if (hasToken) {
      try {
        const raw = window.localStorage.getItem("authUser");
        if (raw) {
          const parsed = JSON.parse(raw) as { id?: string };
          if (parsed && typeof parsed.id === "string") {
            setUserId(parsed.id);
            return;
          }
        }
      } catch {
        // ignore parse errors, userId will remain null
      }
    } else {
      setUserId(null);
    }
  }, [location]);

  const handleSubmitPost = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLoggedIn) return;

    const token = window.localStorage.getItem("authToken");
    if (!token) return;

    if (!newText.trim() && (!newMediaFiles || newMediaFiles.length === 0)) {
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      if (newText.trim()) {
        formData.append("text", newText.trim());
      }
      if (newMediaFiles && newMediaFiles.length > 0) {
        Array.from(newMediaFiles).forEach((file) => {
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
        setNewMediaFiles(null);
      }
    } catch (err) {
      console.error("Error creating post", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMediaFiles(event.target.files);
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
          <button
            type="button"
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            style={{
              marginTop: "0px",
              padding: "0.4rem 0.8rem",
              width: "48px",
              cursor: "pointer",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                ry="2"
                fill="none"
                stroke="#ffffffff"
                strokeWidth="1.6"
              />
              <circle
                cx="9"
                cy="10"
                r="1.6"
                fill="none"
                stroke="#ffffffff"
                strokeWidth="1.6"
              />
              <path
                d="M5 17l4-4 3 3 3-3 4 4"
                fill="none"
                stroke="#ffffffff"
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
          />
          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </form>
      </section>

      <section>{userId && <UserPosts userId={userId} />}</section>
    </main>
  );
}
