import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  getDirectMessages,
  getMessagesWebSocketUrl,
  getUserByUserName,
  markMessageThreadRead,
  purchaseDirectMessageMedia,
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
import PayToViewPaymentModal from "../components/PayToViewPaymentModal";
import LikeBookmarkButtons from "../components/LikeBookmarkButtons";

type UiMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  mediaItems?: { mediaKey: string; mediaType: "image" | "video" | "audio" }[];
  price?: number;
  isUnlocked?: boolean;
  createdAt: string;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getDirectMessageMediaUrl(
  messageId: string,
  mediaKey: string,
  opts?: { thumbnail?: boolean }
): string {
  const url = new URL(
    `${API_BASE}/messages/direct/${encodeURIComponent(
      messageId
    )}/media/${encodeURIComponent(mediaKey)}`,
    window.location.origin
  );

  if (opts?.thumbnail) {
    url.searchParams.set("thumbnail", "1");
  }

  return url.toString();
}

function formatPriceUSD(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
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
  const [canUploadMedia, setCanUploadMedia] = useState(false);

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
  const [draftPrice, setDraftPrice] = useState<string>("");

  const [activeLightboxMedia, setActiveLightboxMedia] = useState<{
    messageId: string;
    mediaKey: string;
    mediaType: "image" | "video" | "audio";
    src: string;
  } | null>(null);

  const [payMessage, setPayMessage] = useState<UiMessage | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const preventDefault = (e: { preventDefault: () => void }) => {
    e.preventDefault();
  };

  const isLightboxOpen = Boolean(activeLightboxMedia);

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
    setCanUploadMedia(me?.isCreator === true || me?.isAdmin === true);
  }, []);

  useEffect(() => {
    if (canUploadMedia) return;
    if (newMediaFiles.length === 0) return;
    setNewMediaFiles([]);
    setDraftPrice("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [canUploadMedia, newMediaFiles.length]);

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
          price:
            typeof (m as any).price === "number" ? (m as any).price : undefined,
          isUnlocked:
            typeof (m as any).isUnlocked === "boolean"
              ? (m as any).isUnlocked
              : undefined,
          createdAt: m.createdAt,
        }));

        ui.forEach((m) => messageIdsRef.current.add(m.id));
        setMessages(ui);
        setNextCursor(result.nextCursor);

        // Best-effort: opening the thread marks it read.
        void markMessageThreadRead(otherUser.id);

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
          price?: number;
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
        const price =
          typeof parsed.price === "number" && Number.isFinite(parsed.price)
            ? parsed.price
            : undefined;
        const createdAt = parsed.timestamp ?? new Date().toISOString();

        if (messageIdsRef.current.has(id)) {
          return;
        }

        messageIdsRef.current.add(id);
        setMessages((prev) => {
          const wasNearBottom = isNearBottom();
          const isMine = !!meUserId && fromUserId === meUserId;
          const hasPricedMedia =
            typeof price === "number" &&
            Number.isFinite(price) &&
            price > 0 &&
            Array.isArray(mediaItems) &&
            mediaItems.length > 0;

          const next = [
            ...prev,
            {
              id,
              fromUserId,
              toUserId,
              text,
              mediaItems,
              price,
              isUnlocked: isMine || !hasPricedMedia,
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

        // If we're viewing this thread, consider any incoming message as read.
        if (fromUserId !== meUserId && otherUser) {
          void markMessageThreadRead(otherUser.id);
        }
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

    const hasMedia = canUploadMedia && newMediaFiles.length > 0;
    if (!draft.trim() && !hasMedia) return;

    try {
      setError(null);
      setIsSending(true);

      const parsedPrice = (() => {
        if (!canUploadMedia) return null;
        if (newMediaFiles.length === 0) return null;
        const raw = draftPrice.trim();
        if (!raw) return null;
        const n = Number(raw);
        if (!Number.isFinite(n) || n <= 0) return null;
        return Number(n.toFixed(2));
      })();

      const created = await sendDirectMessage(otherUser.id, {
        text: draft,
        mediaFiles:
          canUploadMedia && newMediaFiles.length > 0 ? newMediaFiles : null,
        price: parsedPrice,
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
              price: created.price,
              isUnlocked: created.isUnlocked,
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
      setDraftPrice("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadMedia) return;
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
          <Link
            to={`/${encodeURIComponent(otherUser.userName)}`}
            title="View profile"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {otherUser.displayName || otherUser.userName} | @
            {otherUser.userName}
          </Link>
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
                      <>
                        {(() => {
                          const price =
                            typeof m.price === "number" &&
                            Number.isFinite(m.price)
                              ? m.price
                              : 0;
                          const isLocked =
                            !isMine &&
                            price > 0 &&
                            Array.isArray(m.mediaItems) &&
                            m.mediaItems.length > 0 &&
                            m.isUnlocked !== true;

                          return (
                            <>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: `repeat(${mediaGridColumns}, minmax(0, 1fr))`,
                                  gap: "0.5rem",
                                  marginTop: "0.5rem",
                                }}
                              >
                                {m.mediaItems.map((it) => {
                                  const isVideo = it.mediaType === "video";
                                  const isAudio = it.mediaType === "audio";

                                  const src = isLocked
                                    ? getDirectMessageMediaUrl(
                                        m.id,
                                        it.mediaKey,
                                        {
                                          thumbnail: isVideo,
                                        }
                                      )
                                    : getDirectMessageMediaUrl(
                                        m.id,
                                        it.mediaKey
                                      );

                                  const wrapperStyle: React.CSSProperties = {
                                    position: "relative",
                                    display: "inline-block",
                                    width: "100%",
                                  };

                                  if (isLocked) {
                                    if (isAudio) {
                                      return (
                                        <div
                                          key={it.mediaKey}
                                          style={{
                                            borderRadius: "10px",
                                            overflow: "hidden",
                                            border:
                                              "1px solid rgba(255,255,255,0.12)",
                                            background:
                                              "linear-gradient(135deg, rgba(99,102,241,0.16), rgba(15,23,42,0.55))",
                                            height: "88px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "rgba(255,255,255,0.9)",
                                            fontWeight: 700,
                                          }}
                                        >
                                          Locked audio
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={it.mediaKey}
                                        style={wrapperStyle}
                                      >
                                        <SecureImage
                                          src={src}
                                          alt=""
                                          protectContent
                                          isOwner={false}
                                          style={{
                                            width: "100%",
                                            borderRadius: "10px",
                                            objectFit: "cover",
                                            filter: "blur(1px)",
                                          }}
                                          loading="lazy"
                                        />
                                        <div
                                          style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background:
                                              "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.45))",
                                            borderRadius: "10px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              padding: "0.35rem 0.6rem",
                                              borderRadius: "999px",
                                              background: "rgba(0,0,0,0.55)",
                                              border:
                                                "1px solid rgba(255,255,255,0.18)",
                                              color: "rgba(255,255,255,0.95)",
                                              fontSize: "0.85rem",
                                              fontWeight: 700,
                                            }}
                                          >
                                            Locked
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  }

                                  return isVideo ? (
                                    <div
                                      key={it.mediaKey}
                                      style={{
                                        ...wrapperStyle,
                                        cursor: "pointer",
                                      }}
                                      onClick={() => {
                                        setActiveLightboxMedia({
                                          messageId: m.id,
                                          mediaKey: it.mediaKey,
                                          mediaType: it.mediaType,
                                          src,
                                        });
                                      }}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" ||
                                          e.key === " "
                                        ) {
                                          e.preventDefault();
                                          setActiveLightboxMedia({
                                            messageId: m.id,
                                            mediaKey: it.mediaKey,
                                            mediaType: it.mediaType,
                                            src,
                                          });
                                        }
                                      }}
                                    >
                                      <SecureVideo
                                        src={src}
                                        disablePictureInPicture
                                        style={{
                                          width: "100%",
                                          borderRadius: "10px",
                                        }}
                                      />
                                    </div>
                                  ) : isAudio ? (
                                    <div key={it.mediaKey} style={wrapperStyle}>
                                      <audio
                                        src={src}
                                        controls
                                        controlsList="nodownload"
                                        onContextMenu={preventDefault}
                                        onDragStart={preventDefault}
                                        style={{ width: "100%" }}
                                      />
                                    </div>
                                  ) : (
                                    <div key={it.mediaKey} style={wrapperStyle}>
                                      <SecureImage
                                        src={src}
                                        alt=""
                                        style={{
                                          width: "100%",
                                          borderRadius: "10px",
                                          objectFit: "cover",
                                        }}
                                        loading="lazy"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setActiveLightboxMedia({
                                            messageId: m.id,
                                            mediaKey: it.mediaKey,
                                            mediaType: it.mediaType,
                                            src,
                                          });
                                        }}
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                          ) {
                                            e.preventDefault();
                                            setActiveLightboxMedia({
                                              messageId: m.id,
                                              mediaKey: it.mediaKey,
                                              mediaType: it.mediaType,
                                              src,
                                            });
                                          }
                                        }}
                                        tabIndex={0}
                                        role="button"
                                      />
                                    </div>
                                  );
                                })}
                              </div>

                              {isLocked ? (
                                <div
                                  style={{
                                    marginTop: "0.5rem",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="auth-submit"
                                    style={{ width: "auto", marginTop: 0 }}
                                    onClick={() => {
                                      setPayError(null);
                                      setPayMessage(m);
                                    }}
                                  >
                                    Pay {formatPriceUSD(price)} to view
                                  </button>
                                </div>
                              ) : null}
                            </>
                          );
                        })()}
                      </>
                    ) : null}
                    {m.createdAt ? (
                      <div className="message-meta">
                        {formatMessageTime(m.createdAt)}
                        {typeof m.price === "number" &&
                        Number.isFinite(m.price) &&
                        m.price > 0 ? (
                          <span style={{ marginLeft: "0.5rem" }}>
                            • {formatPriceUSD(m.price)}
                          </span>
                        ) : null}
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
          {canUploadMedia ? (
            <>
              <button
                type="button"
                className="icon-button"
                onClick={() => fileInputRef.current?.click()}
                title="Add media"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
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
            </>
          ) : null}
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

        {canUploadMedia && newMediaFiles.length > 0 ? (
          <div
            style={{
              marginTop: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <label className="text-muted" style={{ fontSize: "0.9rem" }}>
              Price (optional)
            </label>
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={draftPrice}
              onChange={(e) => setDraftPrice(e.target.value)}
              className="auth-input"
              style={{ width: "120px" }}
            />
          </div>
        ) : null}

        {canUploadMedia && mediaPreviews.length > 0 ? (
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
          onClose={() => setActiveLightboxMedia(null)}
        >
          {activeLightboxMedia ? (
            <div
              style={{
                position: "relative",
                width: "auto",
                maxWidth: "min(96vw, 1100px)",
                maxHeight: "88vh",
              }}
            >
              {activeLightboxMedia.mediaType === "video" ? (
                <SecureVideo
                  src={activeLightboxMedia.src}
                  isOwner={false}
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
              ) : (
                <SecureImage
                  src={activeLightboxMedia.src}
                  alt=""
                  style={{
                    width: "auto",
                    maxWidth: "min(96vw, 1100px)",
                    maxHeight: "88vh",
                    borderRadius: "12px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                    objectFit: "contain",
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
                  } as React.CSSProperties
                }
              >
                <LikeBookmarkButtons
                  targetType="dmMedia"
                  targetId={activeLightboxMedia.messageId}
                  mediaKey={activeLightboxMedia.mediaKey}
                  mediaType={activeLightboxMedia.mediaType}
                  size={22}
                  showCounts={true}
                />
              </div>
            </div>
          ) : null}
        </Lightbox>

        <PayToViewPaymentModal
          isOpen={!!payMessage}
          amount={typeof payMessage?.price === "number" ? payMessage.price : 0}
          onClose={() => {
            if (isPaying) return;
            setPayMessage(null);
            setPayError(null);
          }}
          isConfirmLoading={isPaying}
          errorMessage={payError}
          onConfirm={async ({ paymentProfileId, cardInfo }) => {
            if (!payMessage) return;
            try {
              setPayError(null);
              setIsPaying(true);
              await purchaseDirectMessageMedia({
                messageId: payMessage.id,
                paymentProfileId,
                cardInfo,
              });

              setMessages((prev) =>
                prev.map((mm) =>
                  mm.id === payMessage.id ? { ...mm, isUnlocked: true } : mm
                )
              );
              setPayMessage(null);
            } catch (err) {
              const message =
                (err instanceof Error && err.message) ||
                "Failed to purchase media.";
              setPayError(message);
            } finally {
              setIsPaying(false);
            }
          }}
        />
      </section>
    </main>
  );
}
