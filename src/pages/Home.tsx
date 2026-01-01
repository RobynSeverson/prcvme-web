import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "react-router-dom";
import Login from "./Login";
import UserPosts from "../components/UserPosts";

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
      <h1>Home</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>New Post</h2>
        <form onSubmit={handleSubmitPost} className="auth-form">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            style={{ width: "100%", marginBottom: "0.75rem" }}
          />
          <input
            type="file"
            multiple
            onChange={handleMediaChange}
            style={{ marginBottom: "0.75rem" }}
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
