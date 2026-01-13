import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { MediaType, UserPost } from "../models/userPost";
import Lightbox from "./Lightbox";
import LikeBookmarkButtons from "./LikeBookmarkButtons";
import SecureImage from "./SecureImage";
import SecureVideo from "./SecureVideo";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type MediaItemEntry = {
  postId: string;
  postUserId: string;
  mediaKey: string;
  mediaType: "image" | "video";
  src: string;
  thumbSrc: string;
};

export type UserMediaGridProps = {
  userId?: string;
  userName?: string;
  protectContent?: boolean;
  isOwner?: boolean;
  reloadToken?: number;
  onStats?: (stats: {
    postCount: number;
    imageCount: number;
    videoCount: number;
  }) => void;
};

export default function UserMediaGrid({
  userId,
  userName,
  protectContent,
  isOwner,
  reloadToken,
  onStats,
}: UserMediaGridProps) {
  const [items, setItems] = useState<MediaItemEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);

  const [activeMedia, setActiveMedia] = useState<{
    type: "image" | "video";
    src: string;
    mediaKey: string;
    mediaType: "image" | "video";
    targetPostId: string;
  } | null>(null);

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
    if (cursor) url.searchParams.set("cursor", cursor);
    return url.toString();
  };

  const buildMediaUrl = (mediaKey: string, postUserId: string) => {
    if (mediaKey.startsWith("http://") || mediaKey.startsWith("https://")) {
      return mediaKey;
    }
    return `${API_BASE}/users/${postUserId}/media/${mediaKey}`;
  };

  const buildThumbUrl = (src: string, mediaType: MediaType) => {
    if (mediaType !== "video") return src;
    return `${src}${src.includes("?") ? "&" : "?"}thumbnail=1`;
  };

  const scrapeMediaFromPosts = (posts: UserPost[]): MediaItemEntry[] => {
    const results: MediaItemEntry[] = [];
    for (const post of posts) {
      const postId = post.id;
      const postUserId = post.userId;
      const mediaItems = Array.isArray(post.mediaItems) ? post.mediaItems : [];
      for (const m of mediaItems) {
        if (!m || typeof m.mediaKey !== "string") continue;
        const type = m.mediaType;
        if (type !== "image" && type !== "video") continue;
        const src = buildMediaUrl(m.mediaKey, postUserId);
        results.push({
          postId,
          postUserId,
          mediaKey: m.mediaKey,
          mediaType: type,
          src,
          thumbSrc: buildThumbUrl(src, type),
        });
      }
    }
    return results;
  };

  const loadPage = async (opts: {
    cursor?: string | null;
    append: boolean;
  }) => {
    if (!apiPathBase) return;
    if (inFlightRef.current) return;
    if (opts.append && !hasMore) return;

    const url = buildApiUrl(opts.cursor);
    if (!url) return;

    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("authToken")
        : null;

    inFlightRef.current = true;
    try {
      if (opts.append) setIsLoadingMore(true);
      else setIsLoading(true);
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
          "Failed to load media.";
        setError(message);
        return;
      }

      const posts =
        data && Array.isArray(data.posts) ? (data.posts as UserPost[]) : [];
      const newNextCursor =
        data &&
        (typeof data.nextCursor === "string" || data.nextCursor === null)
          ? (data.nextCursor as string | null)
          : null;

      setNextCursor(newNextCursor);
      setHasMore(Boolean(newNextCursor));

      const stats =
        data && data.stats && typeof data.stats === "object"
          ? (data.stats as Partial<{
              postCount: unknown;
              imageCount: unknown;
              videoCount: unknown;
            }>)
          : null;

      if (
        stats &&
        typeof stats.postCount === "number" &&
        typeof stats.imageCount === "number" &&
        typeof stats.videoCount === "number"
      ) {
        onStats?.({
          postCount: stats.postCount,
          imageCount: stats.imageCount,
          videoCount: stats.videoCount,
        });
      }

      const scraped = scrapeMediaFromPosts(posts);

      setItems((prev) => {
        if (!opts.append) return scraped;
        const seen = new Set(prev.map((i) => `${i.postId}:${i.mediaKey}`));
        const merged = [...prev];
        for (const item of scraped) {
          const key = `${item.postId}:${item.mediaKey}`;
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(item);
        }
        return merged;
      });
    } catch (err) {
      console.error("Error loading media", err);
      setError("Something went wrong while loading media.");
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    setError(null);

    if (!apiPathBase) return;
    void loadPage({ cursor: null, append: false });
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
        void loadPage({ cursor: nextCursor, append: true });
      },
      { root: null, rootMargin: "400px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [apiPathBase, hasMore, isLoading, isLoadingMore, nextCursor]);

  const isLightboxOpen = Boolean(activeMedia);

  const activeLightboxIndex = useMemo(() => {
    if (!activeMedia) return -1;
    return items.findIndex(
      (it) =>
        it.postId === activeMedia.targetPostId &&
        it.mediaKey === activeMedia.mediaKey
    );
  }, [activeMedia, items]);

  const goToNextLightboxMedia = () => {
    if (items.length <= 1) return;
    setActiveMedia((prev) => {
      if (!prev) return prev;
      const idx = items.findIndex(
        (it) => it.postId === prev.targetPostId && it.mediaKey === prev.mediaKey
      );
      if (idx < 0) return prev;
      const nextIdx = Math.min(idx + 1, items.length - 1);
      if (nextIdx === idx) return prev;
      const next = items[nextIdx];
      return {
        type: next.mediaType,
        src: next.src,
        mediaKey: next.mediaKey,
        mediaType: next.mediaType,
        targetPostId: next.postId,
      };
    });
  };

  const goToPrevLightboxMedia = () => {
    if (items.length <= 1) return;
    setActiveMedia((prev) => {
      if (!prev) return prev;
      const idx = items.findIndex(
        (it) => it.postId === prev.targetPostId && it.mediaKey === prev.mediaKey
      );
      if (idx < 0) return prev;
      const nextIdx = Math.max(idx - 1, 0);
      if (nextIdx === idx) return prev;
      const next = items[nextIdx];
      return {
        type: next.mediaType,
        src: next.src,
        mediaKey: next.mediaKey,
        mediaType: next.mediaType,
        targetPostId: next.postId,
      };
    });
  };

  const swipeRef = useRef<{
    x: number;
    y: number;
    lastX: number;
    lastY: number;
  } | null>(null);

  const onLightboxTouchStart: React.TouchEventHandler = (e) => {
    if (!activeMedia) return;
    const t = e.touches[0];
    if (!t) return;
    swipeRef.current = {
      x: t.clientX,
      y: t.clientY,
      lastX: t.clientX,
      lastY: t.clientY,
    };
  };

  const onLightboxTouchMove: React.TouchEventHandler = (e) => {
    const t = e.touches[0];
    if (!t) return;
    if (!swipeRef.current) return;
    swipeRef.current.lastX = t.clientX;
    swipeRef.current.lastY = t.clientY;
  };

  const onLightboxTouchEnd: React.TouchEventHandler = () => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s) return;

    const dx = s.lastX - s.x;
    const dy = s.lastY - s.y;
    if (Math.abs(dx) < 60) return;
    if (Math.abs(dy) > 60) return;

    if (dx < 0) goToNextLightboxMedia();
    else goToPrevLightboxMedia();
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevLightboxMedia();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextLightboxMedia();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, activeLightboxIndex, items.length]);

  return (
    <section>
      {isLoading && <p className="text-muted">Loading media...</p>}
      {error && <p className="auth-error">{error}</p>}
      {!isLoading && !error && items.length === 0 && (
        <p className="text-muted">No media yet.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {items.map((item) => {
          const canOpen = !protectContent;

          return (
            <div
              key={`${item.postId}:${item.mediaKey}`}
              className="app-card"
              style={{
                position: "relative",
                aspectRatio: "1",
                overflow: "hidden",
                padding: 0,
                borderRadius: "0.75rem",
              }}
            >
              <SecureImage
                src={item.thumbSrc}
                alt="Post media"
                isOwner={isOwner}
                protectContent={protectContent}
                onClick={() => {
                  if (!canOpen) return;
                  setActiveMedia({
                    type: item.mediaType,
                    src: item.src,
                    mediaKey: item.mediaKey,
                    mediaType: item.mediaType,
                    targetPostId: item.postId,
                  });
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  cursor: canOpen ? "pointer" : "default",
                }}
              />

              {item.mediaType === "video" ? (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "999px",
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 8l6 4-6 4V8z"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              ) : null}

              {protectContent ? (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "0.5rem",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.92)",
                    textShadow: "0 2px 12px rgba(0,0,0,0.75)",
                    background:
                      "linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0.25))",
                    pointerEvents: "none",
                  }}
                >
                  Subscribe to view
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {!error && items.length > 0 ? (
        <div style={{ padding: "0.5rem 0" }}>
          {isLoadingMore && <p className="text-muted">Loading more...</p>}
          {!hasMore && <p className="text-muted">That's all for now ;)</p>}
          <div ref={loadMoreRef} style={{ height: "1px" }} />
        </div>
      ) : null}

      <Lightbox isOpen={isLightboxOpen} onClose={() => setActiveMedia(null)}>
        {activeMedia ? (
          <div
            style={{
              position: "relative",
              width: "auto",
              maxWidth: "min(96vw, 1100px)",
              maxHeight: "88vh",
            }}
            onTouchStart={onLightboxTouchStart}
            onTouchMove={onLightboxTouchMove}
            onTouchEnd={onLightboxTouchEnd}
          >
            {activeMedia.type === "image" ? (
              <SecureImage
                src={activeMedia.src}
                alt="Post media"
                isOwner={isOwner}
                protectContent={false}
                style={{
                  width: "auto",
                  maxWidth: "100%",
                  maxHeight: "88vh",
                  objectFit: "contain",
                  borderRadius: "12px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                }}
              />
            ) : (
              <SecureVideo
                src={activeMedia.src}
                isOwner={isOwner}
                protectContent={false}
                disablePictureInPicture
                style={{
                  width: "auto",
                  maxWidth: "100%",
                  maxHeight: "88vh",
                  borderRadius: "12px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                }}
              />
            )}

            <div
              style={
                {
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "999px",
                  background: "rgba(0,0,0,0.45)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  zIndex: 1,
                  ["--text-muted" as any]: "rgba(255,255,255,0.72)",
                } as CSSProperties
              }
            >
              <LikeBookmarkButtons
                targetType="media"
                targetId={activeMedia.targetPostId}
                mediaKey={activeMedia.mediaKey}
                mediaType={activeMedia.mediaType}
                size={22}
                showCounts={true}
              />
            </div>
          </div>
        ) : null}
      </Lightbox>
    </section>
  );
}
