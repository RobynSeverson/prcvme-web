import React, { useEffect, useState } from "react";
import type { UserPost } from "../models/userPost";

export type UserPostProps = {
  post: UserPost;
  protectContent?: boolean;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type LightboxMedia =
  | { type: "image"; src: string; alt?: string }
  | { type: "video"; src: string };

export default function UserPostPanel({ post, protectContent }: UserPostProps) {
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMedia | null>(
    null
  );

  const preventDefault = (e: { preventDefault: () => void }) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (!lightboxMedia) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxMedia(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxMedia]);

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

            const wrapperStyle: React.CSSProperties | undefined = protectContent
              ? {
                  position: "relative",
                  display: "inline-block",
                  width: "100%",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
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

            const blurredMediaStyle: React.CSSProperties | undefined =
              protectContent
                ? {
                    filter: "blur(16px)",
                    transform: "scale(1.06)",
                  }
                : undefined;

            if (item.mediaType === "image") {
              return (
                <div key={`${post.id}-img-${index}`} style={wrapperStyle}>
                  <img
                    src={src}
                    alt="Post media"
                    draggable={protectContent ? false : undefined}
                    onContextMenu={
                      protectContent ? (e) => e.preventDefault() : undefined
                    }
                    onDragStart={
                      protectContent ? (e) => e.preventDefault() : undefined
                    }
                    onClick={
                      protectContent
                        ? undefined
                        : () => setLightboxMedia({ type: "image", src })
                    }
                    style={{
                      cursor: protectContent ? undefined : "zoom-in",
                      width: "100%",
                      maxHeight: "260px",
                      objectFit: "cover",
                      borderRadius: protectContent ? undefined : "0.5rem",
                      userSelect: protectContent ? "none" : undefined,
                      WebkitTouchCallout: protectContent ? "none" : undefined,
                      ...blurredMediaStyle,
                    }}
                  />
                  {protectContent && (
                    <div style={overlayStyle}>Subscribe to view</div>
                  )}
                </div>
              );
            }

            if (item.mediaType === "video") {
              return (
                <div key={`${post.id}-vid-${index}`} style={wrapperStyle}>
                  <video
                    src={src}
                    controls={!protectContent}
                    controlsList={protectContent ? "nodownload" : undefined}
                    onContextMenu={
                      protectContent ? (e) => e.preventDefault() : undefined
                    }
                    style={{
                      width: "100%",
                      maxHeight: "320px",
                      borderRadius: protectContent ? undefined : "0.5rem",
                      pointerEvents: protectContent ? "none" : undefined,
                      ...blurredMediaStyle,
                    }}
                  />
                  {!protectContent ? (
                    <button
                      type="button"
                      onClick={() => setLightboxMedia({ type: "video", src })}
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

      {lightboxMedia ? (
        <div
          onClick={() => setLightboxMedia(null)}
          onContextMenu={preventDefault}
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 1000,
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxMedia(null)}
            aria-label="Close"
            style={{
              position: "fixed",
              top: "12px",
              right: "12px",
              width: "40px",
              height: "40px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(0,0,0,0.4)",
              color: "white",
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: "40px",
              padding: 0,
            }}
          >
            ×
          </button>

          {lightboxMedia.type === "image" ? (
            <img
              src={lightboxMedia.src}
              alt={lightboxMedia.alt ?? ""}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={preventDefault}
              onDragStart={preventDefault}
              style={{
                maxWidth: "min(96vw, 1100px)",
                maxHeight: "88vh",
                borderRadius: "12px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                userSelect: "none",
              }}
            />
          ) : (
            <video
              src={lightboxMedia.src}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onClick={(e) => e.stopPropagation()}
              onContextMenu={preventDefault}
              style={{
                maxWidth: "min(96vw, 1100px)",
                maxHeight: "88vh",
                borderRadius: "12px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              }}
            />
          )}
        </div>
      ) : null}
    </li>
  );
}
