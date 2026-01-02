import React from "react";
import type { UserPost } from "../models/userPost";

export type UserPostProps = {
  post: UserPost;
  protectContent?: boolean;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function UserPostPanel({ post, protectContent }: UserPostProps) {
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
            display: "flex",
            flexWrap: "wrap",
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
                    style={{
                      maxWidth: "150px",
                      maxHeight: "150px",
                      objectFit: "cover",
                      borderRadius: protectContent ? undefined : "0.5rem",
                      userSelect: protectContent ? "none" : undefined,
                      WebkitTouchCallout: protectContent ? "none" : undefined,
                      ...blurredMediaStyle,
                    }}
                  />
                  {protectContent && <div style={overlayStyle}>Subscribe to view</div>}
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
                      maxWidth: "220px",
                      borderRadius: protectContent ? undefined : "0.5rem",
                      pointerEvents: protectContent ? "none" : undefined,
                      ...blurredMediaStyle,
                    }}
                  />
                  {protectContent && <div style={overlayStyle}>Subscribe to view</div>}
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
    </li>
  );
}
