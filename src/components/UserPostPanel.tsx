import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { UserPost } from "../models/userPost";
import Lightbox from "./Lightbox";
import SecureImage from "./SecureImage";
import SecureVideo from "./SecureVideo";
import LikeBookmarkButtons from "./LikeBookmarkButtons";
import { buildProfileImageUrl } from "../helpers/userHelpers";
import { deleteMyPost } from "../helpers/api/apiHelpers";

export type UserPostProps = {
  post: UserPost;
  protectContent?: boolean;
  isOwner?: boolean;
  currentUserId?: string;
  onDeleted?: (postId: string) => void;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type PublicAuthor = {
  id: string;
  userName: string;
  displayName?: string;
  profilePictureUrl?: string;
};

const authorCache = new Map<string, PublicAuthor>();
const authorInFlight = new Map<string, Promise<PublicAuthor | null>>();

const loadAuthor = (userId: string): Promise<PublicAuthor | null> => {
  if (authorCache.has(userId)) {
    return Promise.resolve(authorCache.get(userId)!);
  }

  const existing = authorInFlight.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const response = await fetch(
        `${API_BASE}/users/${encodeURIComponent(userId)}`
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) return null;

      const user =
        data && data.user ? (data.user as Partial<PublicAuthor>) : null;
      if (
        !user ||
        typeof user.userName !== "string" ||
        typeof user.id !== "string"
      ) {
        return null;
      }

      const normalized: PublicAuthor = {
        id: user.id,
        userName: user.userName,
        displayName:
          typeof user.displayName === "string" ? user.displayName : undefined,
        profilePictureUrl:
          typeof user.profilePictureUrl === "string"
            ? user.profilePictureUrl
            : undefined,
      };

      authorCache.set(userId, normalized);
      return normalized;
    } catch {
      return null;
    } finally {
      authorInFlight.delete(userId);
    }
  })();

  authorInFlight.set(userId, promise);
  return promise;
};

export default function UserPostPanel({
  post,
  protectContent,
  isOwner,
  currentUserId,
  onDeleted,
}: UserPostProps) {
  const [author, setAuthor] = useState<PublicAuthor | null>(() => {
    return authorCache.get(post.userId) ?? null;
  });
  const [activeMedia, setActiveMedia] = useState<{
    type: "image" | "video";
    src: string;
  } | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isPostOwner = Boolean(
    isOwner || (currentUserId && currentUserId === post.userId)
  );

  useEffect(() => {
    let cancelled = false;
    setAuthor(authorCache.get(post.userId) ?? null);

    void (async () => {
      const loaded = await loadAuthor(post.userId);
      if (cancelled) return;
      if (loaded) setAuthor(loaded);
    })();

    return () => {
      cancelled = true;
    };
  }, [post.userId]);

  const authorHref = useMemo(() => {
    if (!author?.userName) return undefined;
    return `/${encodeURIComponent(author.userName)}`;
  }, [author?.userName]);

  const authorDisplay =
    (author?.displayName && author.displayName.trim()) ||
    (author?.userName ? `@${author.userName}` : "User");

  const authorAvatarSrc = author?.profilePictureUrl
    ? buildProfileImageUrl(post.userId, author.profilePictureUrl)
    : undefined;

  const isLightboxOpen = Boolean(activeMedia);

  const buildMediaUrl = (imageKey?: string | null) => {
    if (!imageKey) return undefined;
    if (imageKey.startsWith("http://") || imageKey.startsWith("https://")) {
      return imageKey;
    }
    return `${API_BASE}/users/${post.userId}/media/${imageKey}`;
  };

  return (
    <li className="app-card user-post-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.6rem",
          marginBottom: "0.5rem",
        }}
      >
        {authorHref ? (
          <Link
            to={authorHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              textDecoration: "none",
              color: "inherit",
              minWidth: 0,
              flex: "1 1 auto",
            }}
          >
            {authorAvatarSrc ? (
              <img
                src={authorAvatarSrc}
                alt={authorDisplay}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "999px",
                  objectFit: "cover",
                  border: "1px solid rgba(148, 163, 184, 0.35)",
                  background: "rgba(15, 23, 42, 0.4)",
                  flex: "0 0 auto",
                }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "999px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(148, 163, 184, 0.35)",
                  background: "rgba(15, 23, 42, 0.4)",
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 700,
                  flex: "0 0 auto",
                }}
              >
                {(
                  author?.displayName?.trim()?.[0] ||
                  author?.userName?.[0] ||
                  "U"
                ).toUpperCase()}
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1.1,
                minWidth: 0,
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--text-color)" }}>
                {authorDisplay}
              </span>
              {author?.userName ? (
                <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                  @{author.userName}
                </span>
              ) : null}
            </div>
          </Link>
        ) : (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              flex: "1 1 auto",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                background: "rgba(15, 23, 42, 0.4)",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 700,
                flex: "0 0 auto",
              }}
            >
              U
            </div>
            <span style={{ fontWeight: 700, color: "var(--text-color)" }}>
              {authorDisplay}
            </span>
          </div>
        )}

        {isPostOwner ? (
          <button
            type="button"
            className="icon-button"
            onClick={() => {
              setDeleteError(null);
              setIsDeleteOpen(true);
            }}
            title="Delete post"
            aria-label="Delete post"
            style={{ width: "44px", flex: "0 0 auto" }}
            disabled={isDeleting}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M4 7h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M10 11v7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M14 11v7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M6 7l1 14h10l1-14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 7V4h6v3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
      </div>

      {post.text && <p style={{ marginBottom: "0.5rem" }}>{post.text}</p>}
      {post.mediaItems && post.mediaItems.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: (() => {
              const mediaLength = post.mediaItems?.length ?? 0;
              let mediaGridColumns = mediaLength === 1 ? 1 : mediaLength;
              if (mediaLength > 4) {
                mediaGridColumns = 3;
              }
              return `repeat(${mediaGridColumns}, minmax(0, 1fr))`;
            })(),
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          {post.mediaItems.map((item, index) => {
            const src = buildMediaUrl(item.mediaKey);
            if (!src) return null;

            const wrapperStyle: React.CSSProperties = {
              position: "relative",
              display: "inline-block",
              width: "100%",
              borderRadius: protectContent ? "0.5rem" : undefined,
              overflow: protectContent ? "hidden" : undefined,
            };

            const overlayStyle: React.CSSProperties | undefined = protectContent
              ? {
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
                }
              : undefined;

            if (item.mediaType === "image") {
              return (
                <div key={`${post.id}-img-${index}`} style={wrapperStyle}>
                  <SecureImage
                    src={src}
                    alt="Post media"
                    isOwner={isOwner}
                    protectContent={protectContent}
                    onClick={(e) => {
                      if (protectContent) return;
                      e.preventDefault();
                      setActiveMedia({ type: "image", src });
                    }}
                    style={{
                      width: "100%",
                      maxHeight: "260px",
                      objectFit: "cover",
                      borderRadius: protectContent ? undefined : "0.5rem",
                    }}
                  />
                  {protectContent && (
                    <div style={overlayStyle}>Subscribe to view</div>
                  )}
                </div>
              );
            }

            if (item.mediaType === "video") {
              const thumbSrc = `${src}${
                src.includes("?") ? "&" : "?"
              }thumbnail=1`;

              return (
                <div key={`${post.id}-vid-${index}`} style={wrapperStyle}>
                  {protectContent ? (
                    <SecureImage
                      src={thumbSrc}
                      alt="Video preview"
                      isOwner={isOwner}
                      protectContent={false}
                      style={{
                        width: "100%",
                        maxHeight: "320px",
                        objectFit: "cover",
                        borderRadius: "0.5rem",
                      }}
                    />
                  ) : (
                    <SecureVideo
                      src={src}
                      isOwner={isOwner}
                      protectContent={protectContent}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        width: "100%",
                        maxHeight: "320px",
                        borderRadius: protectContent ? undefined : "0.5rem",
                      }}
                    />
                  )}
                  {!protectContent ? (
                    <button
                      type="button"
                      onClick={() => setActiveMedia({ type: "video", src })}
                      aria-label="Open video"
                      title="Open"
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        width: "34px",
                        height: "34px",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.25)",
                        background: "rgba(0,0,0,0.45)",
                        color: "white",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        zIndex: 1,
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        fill="none"
                      >
                        <path
                          d="M9 3H5a2 2 0 0 0-2 2v4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M15 3h4a2 2 0 0 1 2 2v4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9 21H5a2 2 0 0 1-2-2v-4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M15 21h4a2 2 0 0 0 2-2v-4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  ) : null}
                  {protectContent && (
                    <div style={overlayStyle}>Subscribe to view</div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
      <p className="post-meta text-muted" style={{ marginTop: "0.25rem" }}>
        Posted on {new Date(post.createdAt).toLocaleString()}
      </p>

      {/* Like and Bookmark buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "0.5rem",
          paddingTop: "0.5rem",
          borderTop: "1px solid rgba(148, 163, 184, 0.15)",
        }}
      >
        <LikeBookmarkButtons
          targetType="post"
          targetId={post.id}
          size={20}
          showCounts={true}
        />
      </div>

      <Lightbox isOpen={isLightboxOpen} onClose={() => setActiveMedia(null)}>
        {activeMedia?.type === "image" ? (
          <SecureImage
            src={activeMedia.src}
            alt="Post media"
            isOwner={isOwner}
            protectContent={false}
            style={{
              width: "auto",
              maxWidth: "min(96vw, 1100px)",
              maxHeight: "88vh",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          />
        ) : activeMedia?.type === "video" ? (
          <SecureVideo
            src={activeMedia.src}
            isOwner={isOwner}
            protectContent={false}
            disablePictureInPicture
            style={{
              width: "auto",
              maxWidth: "min(96vw, 1100px)",
              maxHeight: "88vh",
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          />
        ) : null}
      </Lightbox>

      <Lightbox
        isOpen={isDeleteOpen}
        onClose={() => {
          if (isDeleting) return;
          setIsDeleteOpen(false);
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
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Delete post?</h3>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Are you sure you want to delete this post? This can’t be undone.
          </p>

          {deleteError ? <p className="auth-error">{deleteError}</p> : null}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <button
              type="button"
              className="icon-button"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="auth-submit"
              onClick={async () => {
                if (isDeleting) return;
                try {
                  setDeleteError(null);
                  setIsDeleting(true);
                  await deleteMyPost(post.id);
                  setIsDeleteOpen(false);
                  onDeleted?.(post.id);
                } catch (err) {
                  const message =
                    (err instanceof Error && err.message) ||
                    "Failed to delete post.";
                  setDeleteError(message);
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              style={{ width: "auto", marginTop: 0 }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Lightbox>
    </li>
  );
}
