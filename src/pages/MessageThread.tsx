import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  getDirectMessages,
  getMessagesWebSocketUrl,
  getUserByUserName,
  sendDirectMessage,
} from "../helpers/api/apiHelpers";
import type { User } from "../models/user";
import {
  getLoggedInUserFromStorage,
  isUserLoggedIn,
} from "../helpers/auth/authHelpers";
import SecureImage from "../components/SecureImage";
import SecureVideo from "../components/SecureVideo";
import Lightbox from "../components/Lightbox";

type UiMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  mediaItems?: { mediaKey: string; mediaType: "image" | "video" | "audio" }[];
  createdAt: string;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getUserMediaUrl(userId: string, mediaKey: string): string {
  return `${API_BASE}/users/${encodeURIComponent(
    userId
  )}/media/${encodeURIComponent(mediaKey)}`;
}

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSameDay) return time;

  const day = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  return `${day} ${time}`;
}

export default function MessageThread() {
  const { userName } = useParams();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(() => isUserLoggedIn());
  const [meUserId, setMeUserId] = useState<string | null>(null);

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const initialScrolledRef = useRef(false);
  const autoLoadLockRef = useRef(false);

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);

  const preventDefault = (e: { preventDefault: () => void }) => {
    e.preventDefault();
  };

  const isLightboxOpen = Boolean(activeMediaId);

  const mediaPreviews = useMemo(() => {
    return newMediaFiles.map((file) => {
      const kind = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
        ? "audio"
        : "file";
      return { file, kind, url: URL.createObjectURL(file) };
    });
  }, [newMediaFiles]);

  useEffect(() => {
    return () => {
      mediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [mediaPreviews]);

  const wsRef = useRef<WebSocket | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    const el = messageListRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const isNearBottom = () => {
    const el = messageListRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
    return distance < 120;
  };

  const loginLink = useMemo(() => {
    return `/login?redirect=${encodeURIComponent(
      location.pathname + location.search
    )}`;
  }, [location.pathname, location.search]);

  useEffect(() => {
    setIsLoggedIn(isUserLoggedIn());
    const me = getLoggedInUserFromStorage();
    setMeUserId(me?.id ?? null);
  }, []);

  useEffect(() => {
    const loadOtherUser = async () => {
      if (!userName) return;

      try {
        setError(null);
        setIsLoadingUser(true);
        const u = await getUserByUserName(userName);
        if (!u) {
          setError("User not found.");
          setOtherUser(null);
          return;
        }
        setOtherUser(u);
      } catch (err) {
        const message =
          (err instanceof Error && err.message) || "Failed to load user.";
        setError(message);
        setOtherUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    void loadOtherUser();
  }, [userName]);

  useEffect(() => {
    const loadInitial = async () => {
      if (!otherUser) return;
      if (!isLoggedIn) return;

      try {
        setError(null);
        setIsLoadingMessages(true);
        setMessages([]);
        messageIdsRef.current = new Set();

        const result = await getDirectMessages(otherUser.id);
        const ui = result.messages.map((m) => ({
          id: m.id,
          fromUserId: m.fromUserId,
          toUserId: m.toUserId,
          text: m.text,
          mediaItems: m.mediaItems,
          createdAt: m.createdAt,
        }));

        ui.forEach((m) => messageIdsRef.current.add(m.id));
        setMessages(ui);
        setNextCursor(result.nextCursor);

        // Ensure we start at the latest message.
        initialScrolledRef.current = false;
      } catch (err) {
        const message =
          (err instanceof Error && err.message) || "Failed to load messages.";
        setError(message);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void loadInitial();
  }, [otherUser, isLoggedIn]);

  useLayoutEffect(() => {
    if (isLoadingMessages) return;
    if (messages.length === 0) return;
    if (initialScrolledRef.current) return;

    // Multi-pass: helps when images/videos change scrollHeight after paint.
    scrollToBottom();
    requestAnimationFrame(() => {
      scrollToBottom();
    });
    setTimeout(() => {
      scrollToBottom();
      initialScrolledRef.current = true;
    }, 0);
  }, [isLoadingMessages, messages.length]);

  useEffect(() => {
    if (!otherUser) return;
    if (!isLoggedIn) return;

    const wsUrl = getMessagesWebSocketUrl(otherUser.id);
    if (!wsUrl) {
      return;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as {
          type?: string;
          id?: string;
          fromUserId?: string;
          toUserId?: string;
          text?: string;
          mediaItems?: {
            mediaKey: string;
            mediaType: "image" | "video" | "audio";
          }[];
          timestamp?: string;
        };

        if (parsed.type !== "dm") return;
        if (
          typeof parsed.id !== "string" ||
          typeof parsed.fromUserId !== "string" ||
          typeof parsed.toUserId !== "string" ||
          typeof parsed.text !== "string"
        ) {
          return;
        }

        const id = parsed.id;
        const fromUserId = parsed.fromUserId;
        const toUserId = parsed.toUserId;
        const text = parsed.text;
        const mediaItems = Array.isArray(parsed.mediaItems)
          ? parsed.mediaItems
          : undefined;
        const createdAt = parsed.timestamp ?? new Date().toISOString();

        if (messageIdsRef.current.has(id)) {
          return;
        }

        messageIdsRef.current.add(id);
        setMessages((prev) => {
          const wasNearBottom = isNearBottom();
          const next = [
            ...prev,
            {
              id,
              fromUserId,
              toUserId,
              text,
              mediaItems,
              createdAt,
            },
          ];

          if (wasNearBottom) {
            requestAnimationFrame(() => {
              scrollToBottom();
            });
          }

          return next;
        });
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      // best-effort; REST history still works
    };

    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [otherUser, isLoggedIn]);

  const loadOlder = async () => {
    if (!otherUser) return;
    if (!nextCursor) return;

    const el = messageListRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;
    const prevScrollTop = el?.scrollTop ?? 0;

    try {
      setIsLoadingMessages(true);
      const result = await getDirectMessages(otherUser.id, nextCursor);

      const ui = result.messages.map((m) => ({
        id: m.id,
        fromUserId: m.fromUserId,
        toUserId: m.toUserId,
        text: m.text,
        mediaItems: m.mediaItems,
        createdAt: m.createdAt,
      }));

      ui.forEach((m) => messageIdsRef.current.add(m.id));
      setMessages((prev) => [...ui, ...prev]);
      setNextCursor(result.nextCursor);

      // Keep the viewport anchored to the same message after prepending.
      requestAnimationFrame(() => {
        const current = messageListRef.current;
        if (!current) return;
        const nextScrollHeight = current.scrollHeight;
        const delta = nextScrollHeight - prevScrollHeight;
        current.scrollTop = prevScrollTop + delta;
      });
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        "Failed to load older messages.";
      setError(message);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleMessageListScroll = () => {
    const el = messageListRef.current;
    if (!el) return;
    if (!nextCursor) return;
    if (autoLoadLockRef.current) return;
    if (isLoadingMessages) return;

    if (el.scrollTop <= 40) {
      autoLoadLockRef.current = true;
      Promise.resolve(loadOlder()).finally(() => {
        autoLoadLockRef.current = false;
      });
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!otherUser) return;

    const hasMedia = newMediaFiles.length > 0;
    if (!draft.trim() && !hasMedia) return;

    try {
      setError(null);
      setIsSending(true);

      const created = await sendDirectMessage(otherUser.id, {
        text: draft,
        mediaFiles: newMediaFiles.length > 0 ? newMediaFiles : null,
      });

      if (!messageIdsRef.current.has(created.id)) {
        messageIdsRef.current.add(created.id);
        setMessages((prev) => {
          const next = [
            ...prev,
            {
              id: created.id,
              fromUserId: created.fromUserId,
              toUserId: created.toUserId,
              text: created.text,
              mediaItems: created.mediaItems,
              createdAt: created.createdAt,
            },
          ];
          requestAnimationFrame(() => {
            scrollToBottom();
          });
          return next;
        });
      }

      setDraft("");
      setNewMediaFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setNewMediaFiles(files);
  };

  const removeMediaAt = (index: number) => {
    setNewMediaFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isLoggedIn) {
    return (
      <main>
        <p>You need to log in to view messages.</p>
        <p>
          <Link to={loginLink}>Go to login</Link>
        </p>
      </main>
    );
  }

  if (isLoadingUser) {
    return (
      <main>
        <p>Loading conversation...</p>
      </main>
    );
  }

  if (error && !otherUser) {
    return (
      <main>
        <p>{error}</p>
        <p>
          <Link to="/messages">Back to messages</Link>
        </p>
      </main>
    );
  }

  if (!otherUser) {
    return (
      <main>
        <p>Conversation not available.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <section style={{ marginBottom: "1rem" }}>
        <p className="text-muted" style={{ margin: 0 }}>
          {otherUser.displayName || otherUser.userName} | @{otherUser.userName}
        </p>
      </section>

      {error && <p className="auth-error">{error}</p>}

      <section
        className="app-card message-thread-card"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <div className="message-thread-actions">
          <Link to="/messages">Back</Link>
        </div>

        <div
          className="message-list"
          ref={messageListRef}
          onScroll={handleMessageListScroll}
          style={{ overflowY: "auto", flex: 1, minHeight: 0 }}
        >
          {isLoadingMessages && messages.length === 0 ? (
            <p>Loading...</p>
          ) : messages.length === 0 ? (
            <p className="text-muted">No messages yet.</p>
          ) : (
            messages.map((m) => {
              const isMine = !!meUserId && m.fromUserId === meUserId;
              let mediaLength = m.mediaItems ? m.mediaItems.length : 0;
              let mediaGridColumns = mediaLength === 1 ? 1 : mediaLength;

              if (mediaLength > 4) {
                mediaGridColumns = 3;
              }

              return (
                <div
                  key={m.id}
                  className={`message-row ${isMine ? "is-mine" : ""}`}
                >
                  <div className="message-bubble">
                    <div>{m.text}</div>
                    {Array.isArray(m.mediaItems) && m.mediaItems.length > 0 ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${mediaGridColumns}, minmax(0, 1fr))`,
                          gap: "0.5rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        {m.mediaItems.map((it) => {
                          const src = getUserMediaUrl(
                            m.fromUserId,
                            it.mediaKey
                          );

                          const mediaId = `${m.id}-${it.mediaType}-${it.mediaKey}`;
                          const isActive = activeMediaId === mediaId;

                          const wrapperStyle: React.CSSProperties = {
                            position: "relative",
                            display: "inline-block",
                            width: "100%",
                          };

                          const lightboxActiveStyle:
                            | React.CSSProperties
                            | undefined = isActive
                            ? {
                                position: "fixed",
                                inset: 0,
                                zIndex: 1001,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "1rem",
                              }
                            : undefined;

                          return it.mediaType === "video" ? (
                            <SecureVideo
                              key={it.mediaKey}
                              src={src}
                              disablePictureInPicture
                              style={{ width: "100%", borderRadius: "10px" }}
                            />
                          ) : it.mediaType === "audio" ? (
                            <audio
                              key={it.mediaKey}
                              src={src}
                              controls
                              controlsList="nodownload"
                              onContextMenu={preventDefault}
                              onDragStart={preventDefault}
                              style={{ width: "100%" }}
                            />
                          ) : (
                            <div
                              key={it.mediaKey}
                              style={{
                                ...wrapperStyle,
                                ...lightboxActiveStyle,
                              }}
                              onClick={
                                isActive
                                  ? () => setActiveMediaId(null)
                                  : undefined
                              }
                              onContextMenu={
                                isActive ? preventDefault : undefined
                              }
                            >
                              <SecureImage
                                src={src}
                                alt=""
                                style={{
                                  width: isActive ? "auto" : "100%",
                                  maxWidth: isActive
                                    ? "min(96vw, 1100px)"
                                    : undefined,
                                  maxHeight: isActive ? "88vh" : undefined,
                                  borderRadius: isActive ? "12px" : "10px",
                                  boxShadow: isActive
                                    ? "0 20px 60px rgba(0,0,0,0.6)"
                                    : undefined,
                                  objectFit: isActive ? "contain" : "cover",
                                }}
                                loading="lazy"
                                onClick={(e) => {
                                  if (isActive) {
                                    e.stopPropagation();
                                    return;
                                  }
                                  setActiveMediaId(mediaId);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setActiveMediaId(mediaId);
                                  }
                                }}
                                tabIndex={0}
                                role="button"
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    {m.createdAt ? (
                      <div className="message-meta">
                        {formatMessageTime(m.createdAt)}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleSend}
          className="auth-form message-form"
          style={{ marginTop: "1rem" }}
        >
          <button
            type="button"
            className="icon-button"
            onClick={() => fileInputRef.current?.click()}
            title="Add media"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
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
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleMediaChange}
            style={{ display: "none" }}
            accept="image/*,video/*,audio/*"
          />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message..."
            className="auth-input"
          />
          <button type="submit" className="auth-submit" disabled={isSending}>
            {isSending ? "Sending..." : "Send"}
          </button>
        </form>

        {mediaPreviews.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            {mediaPreviews.map((p, idx) => (
              <div
                key={`${p.file.name}-${p.file.size}-${idx}`}
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  position: "relative",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.12)",
                }}
                title={p.file.name}
              >
                {p.kind === "image" ? (
                  <img
                    src={p.url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : p.kind === "video" ? (
                  <video
                    src={p.url}
                    muted
                    playsInline
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    {p.kind === "audio" ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M9 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <path
                          d="M11 16V6l10-2v10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M19 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2v5h5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeMediaAt(idx)}
                  aria-label="Remove attachment"
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "2px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    lineHeight: "18px",
                    fontSize: "12px",
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <Lightbox
          isOpen={isLightboxOpen}
          onClose={() => setActiveMediaId(null)}
        />
      </section>
    </main>
  );
}
