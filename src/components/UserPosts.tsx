import { useEffect, useMemo, useRef, useState } from "react";
import type { UserPost } from "../models/userPost";
import UserPostPanel from "./UserPostPanel";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type UserPostsProps = {
  userId?: string;
  userName?: string;
  protectContent?: boolean;
  isOwner?: boolean;
  reloadToken?: number;
};

export default function UserPosts({
  userId,
  userName,
  protectContent,
  isOwner,
  reloadToken,
}: UserPostsProps) {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);

  const apiPathBase = useMemo(() => {
    if (userName) {
      return `${API_BASE}/users/${encodeURIComponent(
        userName
      )}/postsbyusername`;
    }
    if (userId) {
      return `${API_BASE}/users/${encodeURIComponent(userId)}/posts`;
    }
    return null;
  }, [userId, userName]);

  const buildApiUrl = (cursor?: string | null) => {
    if (!apiPathBase) return null;
    const url = new URL(apiPathBase);
    url.searchParams.set("limit", "10");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }
    return url.toString();
  };

  const loadPosts = async (opts: {
    cursor?: string | null;
    append: boolean;
  }) => {
    if (!apiPathBase) return;
    if (inFlightRef.current) return;
    if (opts.append && !hasMore) return;

    const token = window.localStorage.getItem("authToken");
    const url = buildApiUrl(opts.cursor);
    if (!url) return;

    inFlightRef.current = true;
    try {
      if (opts.append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch(url, {
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

      const newPosts =
        data && Array.isArray(data.posts) ? (data.posts as UserPost[]) : [];
      const newNextCursor =
        data &&
        (typeof data.nextCursor === "string" || data.nextCursor === null)
          ? (data.nextCursor as string | null)
          : null;

      setNextCursor(newNextCursor);
      setHasMore(Boolean(newNextCursor));

      setPosts((prev) => {
        if (!opts.append) return newPosts;

        // De-dupe by id in case of race/overlap.
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const post of newPosts) {
          if (!seen.has(post.id)) {
            seen.add(post.id);
            merged.push(post);
          }
        }
        return merged;
      });
    } catch (err) {
      console.error("Error loading posts", err);
      setError("Something went wrong while loading posts.");
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setPosts([]);
    setNextCursor(null);
    setHasMore(true);
    setError(null);

    if (!apiPathBase) return;
    void loadPosts({ cursor: null, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPathBase, reloadToken]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    if (!apiPathBase) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (isLoading || isLoadingMore) return;
        void loadPosts({ cursor: nextCursor, append: true });
      },
      { root: null, rootMargin: "400px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [apiPathBase, hasMore, isLoading, isLoadingMore, nextCursor]);

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

      {!error && posts.length > 0 && (
        <div style={{ padding: "0.5rem 0" }}>
          {isLoadingMore && <p className="text-muted">Loading more...</p>}
          {!hasMore && <p className="text-muted">You’re all caught up.</p>}
          <div ref={loadMoreRef} style={{ height: "1px" }} />
        </div>
      )}
    </section>
  );
}
