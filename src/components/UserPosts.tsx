import { useEffect, useState } from "react";
import type { UserPost } from "../models/userPost";
import UserPostPanel from "./UserPostPanel";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type UserPostsProps = {
  userId?: string;
  userName?: string;
  protectContent?: boolean;
  isOwner?: boolean;
};

export default function UserPosts({
  userId,
  userName,
  protectContent,
  isOwner,
}: UserPostsProps) {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("authToken");

    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let apiPath = `${API_BASE}/users/${userId}/posts`;

        if (userName) {
          apiPath = `${API_BASE}/users/${userName}/postsbyusername`;
        }

        const response = await fetch(apiPath, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            (data && typeof data.error === "string" && data.error) ||
            "Failed to load posts.";
          setError(message);
          return;
        }

        if (data && Array.isArray(data.posts)) {
          setPosts(data.posts as UserPost[]);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error("Error loading posts", err);
        setError("Something went wrong while loading posts.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadPosts();
  }, [userId, userName]);

  return (
    <section>
      {isLoading && <p className="text-muted">Loading posts...</p>}
      {error && <p className="auth-error">{error}</p>}
      {!isLoading && !error && posts.length === 0 && (
        <p className="text-muted">No posts yet.</p>
      )}
      <ul className="user-posts-list">
        {posts.map((post) => (
          <UserPostPanel
            key={post.id}
            post={post}
            protectContent={protectContent}
            isOwner={isOwner}
          />
        ))}
      </ul>
    </section>
  );
}
