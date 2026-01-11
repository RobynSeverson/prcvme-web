import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type {
  FavoriteKind,
  FavoriteTargetType,
  EnrichedFavorite,
  FavoriteWithProfile,
  FavoriteWithPost,
  FavoriteWithMedia,
} from "../models/favorite";
import { getMyFavorites } from "../helpers/api/apiHelpers";
import { buildProfileImageUrl } from "../helpers/userHelpers";
import { isUserLoggedIn } from "../helpers/auth/authHelpers";
import SecureImage from "../components/SecureImage";
import LikeBookmarkButtons from "../components/LikeBookmarkButtons";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type CollectionTab = "profiles" | "posts" | "media";
type CollectionKind = "likes" | "bookmarks";

const TAB_TO_TARGET_TYPE: Record<CollectionTab, FavoriteTargetType> = {
  profiles: "profile",
  posts: "post",
  media: "media",
};

const KIND_TO_FAVORITE_KIND: Record<CollectionKind, FavoriteKind> = {
  likes: "like",
  bookmarks: "bookmark",
};

export default function Collections() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse tab and kind from URL
  const rawTab = searchParams.get("tab");
  const rawKind = searchParams.get("kind");

  const currentTab: CollectionTab =
    rawTab === "profiles" || rawTab === "posts" || rawTab === "media"
      ? rawTab
      : "posts";

  const currentKind: CollectionKind =
    rawKind === "likes" || rawKind === "bookmarks" ? rawKind : "likes";

  const [favorites, setFavorites] = useState<EnrichedFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);

  const setTab = (tab: CollectionTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    setSearchParams(params);
  };

  const setKind = (kind: CollectionKind) => {
    const params = new URLSearchParams(searchParams);
    params.set("kind", kind);
    setSearchParams(params);
  };

  const loadFavorites = async (opts: {
    cursor?: string | null;
    append: boolean;
  }) => {
    if (inFlightRef.current) return;
    if (opts.append && !hasMore) return;

    inFlightRef.current = true;

    try {
      if (opts.append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const result = await getMyFavorites({
        kind: KIND_TO_FAVORITE_KIND[currentKind],
        targetType: TAB_TO_TARGET_TYPE[currentTab],
        limit: 20,
        cursor: opts.cursor ?? undefined,
      });

      setNextCursor(result.nextCursor);
      setHasMore(Boolean(result.nextCursor));

      setFavorites((prev) => {
        if (!opts.append) return result.favorites;

        // De-dupe by id
        const seen = new Set(prev.map((f) => f.id));
        const merged = [...prev];
        for (const fav of result.favorites) {
          if (!seen.has(fav.id)) {
            seen.add(fav.id);
            merged.push(fav);
          }
        }
        return merged;
      });
    } catch (err) {
      const message =
        (err instanceof Error && err.message) || "Failed to load favorites.";
      setError(message);
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Reset and load when tab or kind changes
  useEffect(() => {
    if (!isUserLoggedIn()) {
      setError("You need to be signed in to view your collections.");
      setIsLoading(false);
      return;
    }

    setFavorites([]);
    setNextCursor(null);
    setHasMore(true);
    setError(null);

    void loadFavorites({ cursor: null, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, currentKind]);

  // Infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (isLoading || isLoadingMore) return;
        void loadFavorites({ cursor: nextCursor, append: true });
      },
      { root: null, rootMargin: "400px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoading, isLoadingMore, nextCursor]);

  const handleRemoveFavorite = (favoriteId: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
  };

  if (!isUserLoggedIn()) {
    return (
      <main>
        <h1>Collections</h1>
        <p>You need to be signed in to view your collections.</p>
        <Link to="/login">Go to login</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Collections</h1>

      {/* Kind selector (Likes / Bookmarks) */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <button
          type="button"
          className={currentKind === "likes" ? "auth-submit" : "icon-button"}
          onClick={() => setKind("likes")}
          style={{ width: "auto" }}
        >
          ❤️ Likes
        </button>
        <button
          type="button"
          className={
            currentKind === "bookmarks" ? "auth-submit" : "icon-button"
          }
          onClick={() => setKind("bookmarks")}
          style={{ width: "auto" }}
        >
          🔖 Bookmarks
        </button>
      </div>

      {/* Tab selector (Profiles / Posts / Media) */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "0.75rem",
        }}
      >
        {(["profiles", "posts", "media"] as CollectionTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setTab(tab)}
            style={{
              background: "transparent",
              border: "none",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              fontWeight: currentTab === tab ? 700 : 400,
              color:
                currentTab === tab
                  ? "var(--primary-color)"
                  : "var(--text-muted)",
              borderBottom:
                currentTab === tab
                  ? "2px solid var(--primary-color)"
                  : "2px solid transparent",
              marginBottom: "-0.8rem",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && <p className="text-muted">Loading...</p>}
      {error && <p className="auth-error">{error}</p>}

      {!isLoading && !error && favorites.length === 0 && (
        <p className="text-muted">
          No {currentKind === "likes" ? "liked" : "bookmarked"} {currentTab}{" "}
          yet.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            currentTab === "media"
              ? "repeat(auto-fill, minmax(150px, 1fr))"
              : "1fr",
          gap: "1rem",
        }}
      >
        {favorites.map((fav) => (
          <FavoriteCard
            key={fav.id}
            favorite={fav}
            tab={currentTab}
            kind={currentKind}
            onRemove={() => handleRemoveFavorite(fav.id)}
          />
        ))}
      </div>

      {!error && favorites.length > 0 && (
        <div style={{ padding: "0.5rem 0" }}>
          {isLoadingMore && <p className="text-muted">Loading more...</p>}
          {!hasMore && <p className="text-muted">That's all!</p>}
          <div ref={loadMoreRef} style={{ height: "1px" }} />
        </div>
      )}
    </main>
  );
}

type FavoriteCardProps = {
  favorite: EnrichedFavorite;
  tab: CollectionTab;
  kind: CollectionKind;
  onRemove: () => void;
};

function FavoriteCard({ favorite, tab, kind, onRemove }: FavoriteCardProps) {
  if (tab === "profiles") {
    return (
      <ProfileFavoriteCard
        favorite={favorite as FavoriteWithProfile}
        kind={kind}
        onRemove={onRemove}
      />
    );
  }
  if (tab === "posts") {
    return (
      <PostFavoriteCard
        favorite={favorite as FavoriteWithPost}
        kind={kind}
        onRemove={onRemove}
      />
    );
  }
  if (tab === "media") {
    return (
      <MediaFavoriteCard
        favorite={favorite as FavoriteWithMedia}
        kind={kind}
        onRemove={onRemove}
      />
    );
  }
  return null;
}

function ProfileFavoriteCard({
  favorite,
  kind,
  onRemove,
}: {
  favorite: FavoriteWithProfile;
  kind: CollectionKind;
  onRemove: () => void;
}) {
  const profile = favorite.target;
  if (!profile) {
    return (
      <div className="app-card" style={{ padding: "1rem" }}>
        <p className="text-muted">Profile no longer available</p>
      </div>
    );
  }

  const userName = typeof profile.userName === "string" ? profile.userName : "";
  const displayName =
    typeof profile.displayName === "string" ? profile.displayName : "";
  const profileLink = userName ? `/${userName}` : null;
  const initial = (
    displayName.trim()[0] ||
    userName.trim()[0] ||
    "?"
  ).toUpperCase();

  const profilePictureSrc = buildProfileImageUrl(
    profile.id,
    profile.profilePictureUrl
  );

  return (
    <div className="app-card" style={{ padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {profileLink ? (
          <Link to={profileLink}>
            {profilePictureSrc ? (
              <img
                src={profilePictureSrc}
                alt={displayName || userName || "Profile"}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "999px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "999px",
                  background: "rgba(15, 23, 42, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                {initial}
              </div>
            )}
          </Link>
        ) : (
          <div aria-label="Profile">
            {profilePictureSrc ? (
              <img
                src={profilePictureSrc}
                alt={displayName || "Profile"}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "999px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "999px",
                  background: "rgba(15, 23, 42, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                {initial}
              </div>
            )}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {profileLink ? (
            <Link
              to={profileLink}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>
                {displayName || userName || "Unknown user"}
              </p>
              {userName ? (
                <p
                  className="text-muted"
                  style={{ margin: 0, fontSize: "0.85rem" }}
                >
                  @{userName}
                </p>
              ) : null}
            </Link>
          ) : (
            <>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {displayName || "Unknown user"}
              </p>
              {userName ? (
                <p
                  className="text-muted"
                  style={{ margin: 0, fontSize: "0.85rem" }}
                >
                  @{userName}
                </p>
              ) : null}
            </>
          )}
        </div>
        <LikeBookmarkButtons
          targetType="profile"
          targetId={favorite.targetId}
          likeOnly={kind === "likes"}
          bookmarkOnly={kind === "bookmarks"}
          size={18}
          onLikeChange={(liked) => !liked && kind === "likes" && onRemove()}
          onBookmarkChange={(bookmarked) =>
            !bookmarked && kind === "bookmarks" && onRemove()
          }
          checkInitialStatus={false}
        />
      </div>
      {profile.bio && (
        <p
          className="text-muted"
          style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}
        >
          {profile.bio.length > 100
            ? `${profile.bio.slice(0, 100)}...`
            : profile.bio}
        </p>
      )}
    </div>
  );
}

function PostFavoriteCard({
  favorite,
  kind,
  onRemove,
}: {
  favorite: FavoriteWithPost;
  kind: CollectionKind;
  onRemove: () => void;
}) {
  const post = favorite.target;
  if (!post) {
    return (
      <div className="app-card" style={{ padding: "1rem" }}>
        <p className="text-muted">Post no longer available</p>
      </div>
    );
  }

  const hasMedia = post.mediaItems && post.mediaItems.length > 0;
  const firstMedia = hasMedia ? post.mediaItems[0] : null;

  const buildMediaUrl = (mediaKey: string, userId: string) => {
    if (mediaKey.startsWith("http://") || mediaKey.startsWith("https://")) {
      return mediaKey;
    }
    return `${API_BASE}/users/${userId}/media/${mediaKey}`;
  };

  return (
    <div className="app-card" style={{ padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1 }}>
          {post.text && (
            <p style={{ margin: 0 }}>
              {post.text.length > 150
                ? `${post.text.slice(0, 150)}...`
                : post.text}
            </p>
          )}
        </div>
        <LikeBookmarkButtons
          targetType="post"
          targetId={favorite.targetId}
          likeOnly={kind === "likes"}
          bookmarkOnly={kind === "bookmarks"}
          size={18}
          onLikeChange={(liked) => !liked && kind === "likes" && onRemove()}
          onBookmarkChange={(bookmarked) =>
            !bookmarked && kind === "bookmarks" && onRemove()
          }
          checkInitialStatus={false}
        />
      </div>
      {firstMedia && (
        <div style={{ marginTop: "0.75rem" }}>
          <SecureImage
            src={buildMediaUrl(firstMedia.mediaKey, post.userId)}
            alt="Post media"
            isOwner={false}
            protectContent={false}
            style={{
              width: "100%",
              maxHeight: "200px",
              objectFit: "cover",
              borderRadius: "0.5rem",
            }}
          />
          {post.mediaItems.length > 1 && (
            <p
              className="text-muted"
              style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}
            >
              +{post.mediaItems.length - 1} more
            </p>
          )}
        </div>
      )}
      <p
        className="text-muted"
        style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}
      >
        {new Date(post.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

function MediaFavoriteCard({
  favorite,
  kind,
  onRemove,
}: {
  favorite: FavoriteWithMedia;
  kind: CollectionKind;
  onRemove: () => void;
}) {
  const post = favorite.target;
  const mediaKey = favorite.mediaKey;

  if (!post || !mediaKey) {
    return (
      <div
        className="app-card"
        style={{
          aspectRatio: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p className="text-muted" style={{ fontSize: "0.85rem" }}>
          Unavailable
        </p>
      </div>
    );
  }

  const buildMediaUrl = (key: string, userId: string) => {
    if (key.startsWith("http://") || key.startsWith("https://")) {
      return key;
    }
    return `${API_BASE}/users/${userId}/media/${key}`;
  };

  const mediaSrc = buildMediaUrl(mediaKey, post.userId);

  return (
    <div
      className="app-card"
      style={{
        position: "relative",
        aspectRatio: "1",
        overflow: "hidden",
        padding: 0,
      }}
    >
      <SecureImage
        src={mediaSrc}
        alt="Saved media"
        isOwner={false}
        protectContent={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "0.25rem",
          right: "0.25rem",
          background: "rgba(0,0,0,0.5)",
          borderRadius: "50%",
        }}
      >
        <LikeBookmarkButtons
          targetType="media"
          targetId={favorite.targetId}
          mediaKey={mediaKey}
          likeOnly={kind === "likes"}
          bookmarkOnly={kind === "bookmarks"}
          size={16}
          onLikeChange={(liked) => !liked && kind === "likes" && onRemove()}
          onBookmarkChange={(bookmarked) =>
            !bookmarked && kind === "bookmarks" && onRemove()
          }
          checkInitialStatus={false}
          style={{ color: "white" }}
        />
      </div>
    </div>
  );
}
