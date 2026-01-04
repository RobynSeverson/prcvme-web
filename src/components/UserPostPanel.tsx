import React, { useState } from "react";
import type { UserPost } from "../models/userPost";
import Lightbox from "./Lightbox";
import SecureImage from "./SecureImage";
import SecureVideo from "./SecureVideo";

export type UserPostProps = {
  post: UserPost;
  protectContent?: boolean;
  isOwner?: boolean;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function UserPostPanel({
  post,
  protectContent,
  isOwner,
}: UserPostProps) {
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);

  const isLightboxOpen = Boolean(activeMediaId);

  const buildMediaUrl = (imageKey?: string | null) => {
    if (!imageKey) return undefined;
    if (imageKey.startsWith("http://") || imageKey.startsWith("https://")) {
      return imageKey;
    }
    return `${API_BASE}/users/${post.userId}/media/${imageKey}`;
  };

  return (
    <li className="app-card user-post-card">
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

            const mediaId = `${post.id}-${item.mediaType}-${index}`;
            const isActive = activeMediaId === mediaId;

            const wrapperStyle: React.CSSProperties = {
              position: "relative",
              display: "inline-block",
              width: "100%",
              borderRadius: protectContent ? "0.5rem" : undefined,
              overflow: protectContent ? "hidden" : undefined,
            };

            const lightboxActiveStyle: React.CSSProperties | undefined =
              isActive
                ? {
                    position: "fixed",
                    inset: 0,
                    zIndex: 1001,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                    borderRadius: 0,
                    overflow: "visible",
                  }
                : undefined;

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
                <div
                  key={`${post.id}-img-${index}`}
                  style={{ ...wrapperStyle, ...lightboxActiveStyle }}
                  onContextMenu={
                    isActive ? (e) => e.preventDefault() : undefined
                  }
                  onClick={isActive ? () => setActiveMediaId(null) : undefined}
                >
                  <SecureImage
                    src={src}
                    alt="Post media"
                    isOwner={isOwner}
                    protectContent={protectContent}
                    onClick={(e) => {
                      if (protectContent) return;
                      if (isActive) {
                        e.stopPropagation();
                        return;
                      }
                      setActiveMediaId(mediaId);
                    }}
                    style={{
                      width: isActive ? "auto" : "100%",
                      maxWidth: isActive ? "min(96vw, 1100px)" : undefined,
                      maxHeight: isActive ? "88vh" : "260px",
                      objectFit: isActive ? "contain" : "cover",
                      borderRadius: isActive
                        ? "12px"
                        : protectContent
                        ? undefined
                        : "0.5rem",
                      boxShadow: isActive
                        ? "0 20px 60px rgba(0,0,0,0.6)"
                        : undefined,
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
                <div
                  key={`${post.id}-vid-${index}`}
                  style={{ ...wrapperStyle, ...lightboxActiveStyle }}
                  onContextMenu={
                    isActive ? (e) => e.preventDefault() : undefined
                  }
                  onClick={isActive ? () => setActiveMediaId(null) : undefined}
                >
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
                      disablePictureInPicture={isActive}
                      onClick={(e) => {
                        if (isActive) {
                          e.stopPropagation();
                        }
                      }}
                      style={{
                        width: isActive ? "auto" : "100%",
                        maxWidth: isActive ? "min(96vw, 1100px)" : undefined,
                        maxHeight: isActive ? "88vh" : "320px",
                        borderRadius: isActive
                          ? "12px"
                          : protectContent
                          ? undefined
                          : "0.5rem",
                        boxShadow: isActive
                          ? "0 20px 60px rgba(0,0,0,0.6)"
                          : undefined,
                      }}
                    />
                  )}
                  {!protectContent ? (
                    <button
                      type="button"
                      onClick={() => setActiveMediaId(mediaId)}
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

      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setActiveMediaId(null)}
      />
    </li>
  );
}
