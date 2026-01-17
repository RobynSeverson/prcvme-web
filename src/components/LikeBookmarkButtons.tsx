import { useCallback, useEffect, useState } from "react";
import type { FavoriteKind, FavoriteTargetType } from "../models/favorite";
import type { MediaType } from "../models/userPost";
import {
  createFavorite,
  deleteFavorite,
  getFavoriteStatus,
  getFavoriteCount,
} from "../helpers/api/apiHelpers";
import { useCurrentUser } from "../context/CurrentUserContext";

export type LikeBookmarkButtonsProps = {
  targetType: FavoriteTargetType;
  targetId: string;
  mediaKey?: string;
  mediaType?: MediaType;
  /** Show only like button */
  likeOnly?: boolean;
  /** Show only bookmark button */
  bookmarkOnly?: boolean;
  /** Size of the icons */
  size?: number;
  /** Callback when like status changes */
  onLikeChange?: (liked: boolean) => void;
  /** Callback when bookmark status changes */
  onBookmarkChange?: (bookmarked: boolean) => void;
  /** Whether to check initial status on mount */
  checkInitialStatus?: boolean;
  /** Whether to show like/bookmark counts */
  showCounts?: boolean;
  /** Read-only mode - shows counts but buttons are not interactive */
  readonly?: boolean;
  /** Custom class name for container */
  className?: string;
  /** Custom style for container */
  style?: React.CSSProperties;
};

/**
 * Heart icon for like button
 */
function HeartIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/**
 * Bookmark icon for bookmark button
 */
function BookmarkIcon({
  filled,
  size = 20,
}: {
  filled: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/**
 * Reusable like/bookmark buttons component.
 * Handles toggling likes and bookmarks for profiles, posts, and media items.
 */
export default function LikeBookmarkButtons({
  targetType,
  targetId,
  mediaKey,
  mediaType,
  likeOnly = false,
  bookmarkOnly = false,
  size = 20,
  onLikeChange,
  onBookmarkChange,
  checkInitialStatus = true,
  showCounts = false,
  readonly = false,
  className,
  style,
}: LikeBookmarkButtonsProps) {
  const { isAuthenticated, authedFetch } = useCurrentUser();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState<number | null>(null);
  const isLoggedIn = isAuthenticated;

  const showLike = !bookmarkOnly;
  const showBookmark = !likeOnly;

  const isInteractive = !readonly && isLoggedIn;

  // Check initial status on mount
  useEffect(() => {
    if (!targetId) return;

    let cancelled = false;

    const checkStatus = async () => {
      try {
        // Only check user's favorite status if logged in and not readonly
        if (checkInitialStatus && isLoggedIn && !readonly) {
          if (showLike) {
            const liked = await getFavoriteStatus(
              {
                kind: "like",
                targetType,
                targetId,
                mediaKey,
              },
              { authedFetch }
            );
            if (!cancelled) setIsLiked(liked);
          }

          if (showBookmark) {
            const bookmarked = await getFavoriteStatus(
              {
                kind: "bookmark",
                targetType,
                targetId,
                mediaKey,
              },
              { authedFetch }
            );
            if (!cancelled) setIsBookmarked(bookmarked);
          }
        }

        // Fetch counts if showCounts is enabled
        if (showCounts) {
          if (showLike) {
            const count = await getFavoriteCount({
              kind: "like",
              targetType,
              targetId,
              mediaKey,
            });
            if (!cancelled) setLikeCount(count);
          }

          if (showBookmark) {
            const count = await getFavoriteCount({
              kind: "bookmark",
              targetType,
              targetId,
              mediaKey,
            });
            if (!cancelled) setBookmarkCount(count);
          }
        }
      } catch {
        // Ignore errors
      }
    };

    void checkStatus();

    return () => {
      cancelled = true;
    };
  }, [
    targetType,
    targetId,
    mediaKey,
    checkInitialStatus,
    showLike,
    showBookmark,
    showCounts,
    readonly,
    isLoggedIn,
  ]);

  const handleToggle = useCallback(
    async (kind: FavoriteKind) => {
      // Don't allow interaction if readonly or not logged in
      if (!isInteractive) {
        return;
      }

      const isCurrentlyActive = kind === "like" ? isLiked : isBookmarked;
      const setLoading =
        kind === "like" ? setIsLikeLoading : setIsBookmarkLoading;
      const setActive = kind === "like" ? setIsLiked : setIsBookmarked;
      const setCount = kind === "like" ? setLikeCount : setBookmarkCount;
      const currentCount = kind === "like" ? likeCount : bookmarkCount;
      const onChangeCallback =
        kind === "like" ? onLikeChange : onBookmarkChange;

      setLoading(true);

      try {
        if (isCurrentlyActive) {
          await deleteFavorite(
            {
              kind,
              targetType,
              targetId,
              mediaKey,
            },
            { authedFetch }
          );
          setActive(false);
          // Update count if we're showing counts
          if (showCounts && currentCount !== null) {
            setCount(Math.max(0, currentCount - 1));
          }
          onChangeCallback?.(false);
        } else {
          await createFavorite(
            {
              kind,
              targetType,
              targetId,
              mediaKey,
              mediaType,
            },
            { authedFetch }
          );
          setActive(true);
          // Update count if we're showing counts
          if (showCounts && currentCount !== null) {
            setCount(currentCount + 1);
          }
          onChangeCallback?.(true);
        }
      } catch (err) {
        console.error(`Failed to toggle ${kind}:`, err);
      } finally {
        setLoading(false);
      }
    },
    [
      isLiked,
      isBookmarked,
      likeCount,
      bookmarkCount,
      targetType,
      targetId,
      mediaKey,
      mediaType,
      onLikeChange,
      onBookmarkChange,
      isInteractive,
      showCounts,
    ]
  );

  const buttonStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    cursor: isInteractive ? "pointer" : "default",
    padding: "0.35rem",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.15s, transform 0.15s",
  };

  const formatCount = (count: number | null): string => {
    if (count === null) return "";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
  };

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        ...style,
      }}
    >
      {showLike && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.15rem",
          }}
        >
          <button
            type="button"
            onClick={() => void handleToggle("like")}
            disabled={isLikeLoading || !isInteractive}
            title={
              !isInteractive ? "Log in to like" : isLiked ? "Unlike" : "Like"
            }
            aria-label={
              !isInteractive ? "Log in to like" : isLiked ? "Unlike" : "Like"
            }
            style={{
              ...buttonStyle,
              color: isLiked ? "#ef4444" : "var(--text-muted)",
              opacity: isLikeLoading ? 0.5 : 1,
            }}
          >
            <HeartIcon filled={isLiked} size={size} />
          </button>
          {showCounts && likeCount !== null && (
            <span
              className="text-muted"
              style={{
                fontSize: "0.85rem",
                minWidth: "1.5rem",
              }}
            >
              {formatCount(likeCount)}
            </span>
          )}
        </div>
      )}

      {showBookmark && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.15rem",
          }}
        >
          <button
            type="button"
            onClick={() => void handleToggle("bookmark")}
            disabled={isBookmarkLoading || !isInteractive}
            title={
              !isInteractive
                ? "Log in to bookmark"
                : isBookmarked
                ? "Remove bookmark"
                : "Bookmark"
            }
            aria-label={
              !isInteractive
                ? "Log in to bookmark"
                : isBookmarked
                ? "Remove bookmark"
                : "Bookmark"
            }
            style={{
              ...buttonStyle,
              color: isBookmarked ? "#3b82f6" : "var(--text-muted)",
              opacity: isBookmarkLoading ? 0.5 : 1,
            }}
          >
            <BookmarkIcon filled={isBookmarked} size={size} />
          </button>
          {showCounts && bookmarkCount !== null && (
            <span
              className="text-muted"
              style={{
                fontSize: "0.85rem",
                minWidth: "1.5rem",
              }}
            >
              {formatCount(bookmarkCount)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
