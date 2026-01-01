import type { UserPost } from "../models/userPost";

export type UserPostProps = {
  post: UserPost;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function UserPostPanel({ post }: UserPostProps) {
  const buildMediaUrl = (imageKey?: string | null) => {
    if (!imageKey) return undefined;
    if (imageKey.startsWith("http://") || imageKey.startsWith("https://")) {
      return imageKey;
    }
    return `${API_BASE}/users/${post.userId}/media/${imageKey}`;
  };

  return (
    <li
      style={{
        border: "1px solid rgba(148, 163, 184, 0.4)",
        borderRadius: "0.75rem",
        padding: "0.75rem 1rem",
        marginBottom: "0.75rem",
      }}
    >
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

            if (item.mediaType === "image") {
              return (
                <img
                  key={`${post.id}-img-${index}`}
                  src={src}
                  alt="Post media"
                  style={{
                    maxWidth: "150px",
                    maxHeight: "150px",
                    objectFit: "cover",
                    borderRadius: "0.5rem",
                  }}
                />
              );
            }

            if (item.mediaType === "video") {
              return (
                <video
                  key={`${post.id}-vid-${index}`}
                  src={src}
                  controls
                  style={{
                    maxWidth: "220px",
                    borderRadius: "0.5rem",
                  }}
                />
              );
            }

            return null;
          })}
        </div>
      )}
      <p
        style={{
          fontSize: "0.8rem",
          color: "#6b7280",
          marginTop: "0.25rem",
        }}
      >
        Posted on {new Date(post.createdAt).toLocaleString()}
      </p>
    </li>
  );
}
