import { useEffect, useMemo, useState } from "react";
import type { User } from "../../models/user";
import { getAPIBase } from "../../helpers/api/apiHelpers";
import { useCurrentUser } from "../../context/CurrentUserContext";

const API_BASE = getAPIBase();

function MediaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        ry="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="9"
        cy="10"
        r="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M5 17l4-4 3 3 3-3 4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15 10l4-2v8l-4-2v-4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="4"
        y="7"
        width="11"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function AudioIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 18V6l10-2v12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="16" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function getUserMediaUrl(
  userId: string,
  mediaKey: string,
  opts?: { thumbnail?: boolean }
): string {
  const url = new URL(
    `${API_BASE}/users/${encodeURIComponent(userId)}/media/${encodeURIComponent(
      mediaKey
    )}`,
    window.location.origin
  );

  if (opts?.thumbnail) {
    url.searchParams.set("thumbnail", "1");
  }

  return url.toString();
}

type Props = {
  user: User;
  onUserUpdated?: (user: User) => void;
};

export default function CreatorWelcomeMessageCard({
  user,
  onUserUpdated,
}: Props) {
  const { isAuthenticated, authedFetch, token } = useCurrentUser();

  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState("");
  const [price, setPrice] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const trimmedText = useMemo(() => text.trim(), [text]);
  const charsLeft = 500 - text.length;

  useEffect(() => {
    setEnabled(user.welcomeMessageEnabled === true);
    setText(
      typeof user.welcomeMessageText === "string" ? user.welcomeMessageText : ""
    );
    setPrice(
      typeof user.welcomeMessagePrice === "number" &&
        Number.isFinite(user.welcomeMessagePrice) &&
        user.welcomeMessagePrice > 0
        ? String(user.welcomeMessagePrice)
        : ""
    );
    setError(null);
    setSuccess(null);
  }, [
    user.welcomeMessageEnabled,
    user.welcomeMessagePrice,
    user.welcomeMessageText,
  ]);

  const mediaItems = Array.isArray(user.welcomeMessageMediaItems)
    ? user.welcomeMessageMediaItems
    : [];

  const WelcomeMediaThumb = ({
    mediaKey,
    mediaType,
  }: {
    mediaKey: string;
    mediaType: "image" | "video" | "audio";
  }) => {
    const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    const thumbUrl = useMemo(() => {
      if (!user.id) return "";
      return getUserMediaUrl(user.id, mediaKey, { thumbnail: false });
    }, [mediaKey, user.id]);

    useEffect(() => {
      setFailed(false);
      setResolvedSrc(null);

      if (typeof window === "undefined") return;

      if (mediaType === "audio") {
        setFailed(true);
        return;
      }

      if (!token) {
        // Without a token we can't fetch protected/owner thumbnails reliably.
        setFailed(true);
        return;
      }
      if (!thumbUrl) {
        setFailed(true);
        return;
      }

      const controller = new AbortController();
      let objectUrl: string | null = null;

      (async () => {
        try {
          const response = await authedFetch(thumbUrl, {
            signal: controller.signal,
          });

          if (!response.ok) {
            setFailed(true);
            return;
          }

          const contentType = response.headers.get("Content-Type") || "";
          if (!contentType.toLowerCase().startsWith("image/")) {
            setFailed(true);
            return;
          }

          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          setResolvedSrc(objectUrl);
        } catch {
          if (!controller.signal.aborted) {
            setFailed(true);
          }
        }
      })();

      return () => {
        controller.abort();
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    }, [authedFetch, mediaType, thumbUrl, token]);

    const tileStyle: React.CSSProperties = {
      width: "52px",
      height: "52px",
      borderRadius: "10px",
      overflow: "hidden",
      position: "relative",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(0,0,0,0.12)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "rgba(255,255,255,0.72)",
    };

    const overlayStyle: React.CSSProperties = {
      position: "absolute",
      left: "6px",
      bottom: "6px",
      width: "20px",
      height: "20px",
      borderRadius: "999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.55)",
      border: "1px solid rgba(255,255,255,0.14)",
    };

    const typeIcon =
      mediaType === "video" ? (
        <VideoIcon size={14} />
      ) : mediaType === "audio" ? (
        <AudioIcon size={14} />
      ) : (
        <MediaIcon size={14} />
      );

    if (failed || !resolvedSrc || mediaType === "audio") {
      return (
        <div style={tileStyle} title={mediaType}>
          {typeIcon}
        </div>
      );
    }

    return (
      <div style={tileStyle} title={mediaType}>
        <img
          src={resolvedSrc}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={overlayStyle}>{typeIcon}</div>
      </div>
    );
  };

  const normalizeCurrencyInput = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const withLeadingZero = trimmed.startsWith(".") ? `0${trimmed}` : trimmed;
    return withLeadingZero.endsWith(".")
      ? withLeadingZero.slice(0, -1)
      : withLeadingZero;
  };

  const isValidCurrency = (value: string): boolean => {
    const normalized = normalizeCurrencyInput(value);
    if (!normalized) return false;
    return /^\d+(\.\d{1,2})?$/.test(normalized);
  };

  const validate = (): string | null => {
    if (text.length > 500)
      return "Welcome message must be 500 characters or less.";
    if (enabled && !trimmedText)
      return "Enter a welcome message (or disable it).";

    const trimmedPrice = price.trim();
    if (trimmedPrice) {
      if (!isValidCurrency(trimmedPrice)) {
        return "Price must have at most 2 decimal places.";
      }
      const parsed = Number(normalizeCurrencyInput(trimmedPrice));
      if (!Number.isFinite(parsed) || parsed < 0) {
        return "Price must be a valid number.";
      }
      if (parsed > 100) {
        return "Price must be <= 100.00.";
      }
      if (parsed > 0 && mediaItems.length === 0) {
        return "Paid welcome messages must include media.";
      }
    }

    return null;
  };

  const handleUploadMedia = async (files: FileList | null) => {
    setError(null);
    setSuccess(null);

    if (!files || files.length === 0) return;

    if (!isAuthenticated) {
      setError("You need to be signed in to upload media.");
      return;
    }

    setIsUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("media", f));

      const response = await authedFetch(
        `${API_BASE}/users/me/welcome-message-media`,
        {
          method: "POST",
          body: form,
          requireAuth: true,
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to upload media.";
        setError(message);
        return;
      }

      if (data && data.user) {
        onUserUpdated?.(data.user as User);
      }

      setSuccess("Media uploaded.");
    } catch (err) {
      console.error("Error uploading welcome message media", err);
      setError("Something went wrong while uploading media.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearMedia = async () => {
    setError(null);
    setSuccess(null);

    if (!isAuthenticated) {
      setError("You need to be signed in to update creator settings.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await authedFetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ welcomeMessageMediaItems: [] }),
        requireAuth: true,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to clear media.";
        setError(message);
        return;
      }

      if (data && data.user) {
        onUserUpdated?.(data.user as User);
      }

      setSuccess("Media cleared.");
    } catch (err) {
      console.error("Error clearing welcome message media", err);
      setError("Something went wrong while clearing media.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isAuthenticated) {
      setError("You need to be signed in to update creator settings.");
      return;
    }

    setIsSaving(true);
    try {
      const trimmedPrice = price.trim();
      const parsedPrice =
        trimmedPrice && isValidCurrency(trimmedPrice)
          ? Number(normalizeCurrencyInput(trimmedPrice))
          : null;

      const payload: Record<string, unknown> = {
        welcomeMessageEnabled: enabled,
        welcomeMessageText: trimmedText,
        welcomeMessagePrice:
          typeof parsedPrice === "number" && Number.isFinite(parsedPrice)
            ? parsedPrice
            : null,
      };

      const response = await authedFetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        requireAuth: true,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to update welcome message settings.";
        setError(message);
        return;
      }

      if (data && data.user) {
        onUserUpdated?.(data.user as User);
      }

      setSuccess("Welcome message settings updated.");
    } catch (err) {
      console.error("Error updating welcome message settings", err);
      setError("Something went wrong while updating welcome message settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-card" style={{ padding: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Welcome message</h2>

      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
        Optionally send an automatic DM to new subscribers.
      </p>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
          userSelect: "none",
        }}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            setSuccess(null);
            setError(null);
          }}
        />
        <span>Send welcome message on subscribe</span>
      </label>

      <label className="auth-field">
        <span>
          Message {enabled ? "(required)" : "(optional)"} — {charsLeft} left
        </span>
        <textarea
          rows={4}
          className="new-post-textarea"
          value={text}
          placeholder={
            "Thanks for subscribing! Here’s what to expect… (links, perks, schedule, etc.)"
          }
          onChange={(e) => {
            setText(e.target.value);
            setSuccess(null);
            setError(null);
          }}
        />
      </label>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "0.75rem",
          alignItems: "end",
          marginTop: "0.75rem",
        }}
      >
        <label className="auth-field" style={{ margin: 0 }}>
          <span>Optional price (USD)</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={price}
            placeholder="0.00"
            onChange={(e) => {
              setPrice(e.target.value);
              setSuccess(null);
              setError(null);
            }}
          />
        </label>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <label
            className="auth-toggle"
            style={{
              marginTop: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: isUploading ? "not-allowed" : "pointer",
              opacity: isUploading ? 0.7 : 1,
            }}
            title="Upload media"
          >
            <MediaIcon size={16} />
            <span>{isUploading ? "Uploading…" : "Media"}</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              style={{ display: "none" }}
              onChange={(e) => {
                void handleUploadMedia(e.target.files);
                e.currentTarget.value = "";
              }}
              disabled={isUploading}
            />
          </label>

          {mediaItems.length > 0 ? (
            <button
              type="button"
              className="auth-toggle"
              style={{ marginTop: 0 }}
              onClick={() => void handleClearMedia()}
              disabled={isSaving || isUploading}
            >
              Clear ({mediaItems.length})
            </button>
          ) : null}
        </div>
      </div>

      {mediaItems.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginTop: "0.75rem",
          }}
        >
          {mediaItems.map((m, idx) => (
            <WelcomeMediaThumb
              key={`${m.mediaKey}-${idx}`}
              mediaKey={m.mediaKey}
              mediaType={m.mediaType}
            />
          ))}
        </div>
      ) : null}

      {error ? <p className="auth-error">{error}</p> : null}
      {success ? <p className="auth-success">{success}</p> : null}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="auth-submit"
          style={{ width: "auto" }}
          onClick={() => void handleSave()}
          disabled={isSaving || isUploading}
        >
          {isSaving ? "Saving..." : "Save welcome message"}
        </button>
      </div>
    </div>
  );
}
