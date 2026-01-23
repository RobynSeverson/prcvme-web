import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  getDirectMessages,
  getMessagesWebSocketUrl,
  getUserByUserName,
  deleteDirectMessage,
  markMessageThreadRead,
  purchaseDirectMessageMedia,
  sendDirectMessage,
  sendTip,
  getMySubscriptionStatus,
} from "../../helpers/api/apiHelpers";
import type { User } from "../../models/user";
import { useCurrentUser } from "../../context/CurrentUserContext";
import SecureImage from "../../components/SecureImage";
import SecureVideo from "../../components/SecureVideo";
import Lightbox from "../../components/Lightbox";
import PayToViewPaymentModal from "../../components/PayToViewPaymentModal";
import LikeBookmarkButtons from "../../components/LikeBookmarkButtons";
import { buildProfileImageUrl } from "../../helpers/userHelpers";
import styles from "./MessageThread.module.css";

type UiMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  mediaItems?: { mediaKey: string; mediaType: "image" | "video" | "audio" }[];
  price?: number;
  isUnlocked?: boolean;
  deleted?: boolean;
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

  const {
    user: currentUser,
    token,
    isAuthenticated,
    authedFetch,
  } = useCurrentUser();

  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated);
  const [meUserId, setMeUserId] = useState<string | null>(null);
  const [canUploadMedia, setCanUploadMedia] = useState(false);
  const [canDeleteMessages, setCanDeleteMessages] = useState(false);

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

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

  const [deleteMessageTarget, setDeleteMessageTarget] =
    useState<UiMessage | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showTipDialog, setShowTipDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>("");
  const [showTipPayment, setShowTipPayment] = useState(false);
  const [tipError, setTipError] = useState<string | null>(null);
  const [isSendingTip, setIsSendingTip] = useState(false);

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
    return `/account/login?redirect=${encodeURIComponent(
      location.pathname + location.search
    )}`;
  }, [location.pathname, location.search]);

  const otherAvatarSrc = useMemo(() => {
    if (!otherUser) return undefined;
    return buildProfileImageUrl(otherUser.id, otherUser.profilePictureUrl);
  }, [otherUser]);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated);
    setMeUserId(currentUser?.id ?? null);
    setCanUploadMedia(
      currentUser?.isCreator === true || currentUser?.isAdmin === true
    );
    setCanDeleteMessages(currentUser?.isCreator === true);
  }, [currentUser, isAuthenticated]);

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
    const checkSubscription = async () => {
      if (!otherUser) {
        setIsSubscribed(false);
        return;
      }
      if (!isLoggedIn) {
        setIsSubscribed(false);
        return;
      }

      try {
        const subscribed = await getMySubscriptionStatus(otherUser.id, {
          authedFetch,
        });
        setIsSubscribed(subscribed);
      } catch (err) {
        // If we can't check subscription status, default to false
        setIsSubscribed(false);
      }
    };

    void checkSubscription();
  }, [otherUser, isLoggedIn, authedFetch]);

  useEffect(() => {
    const loadInitial = async () => {
      if (!otherUser) return;
      if (!isLoggedIn) return;

      try {
        setError(null);
        setIsLoadingMessages(true);
        setMessages([]);
        messageIdsRef.current = new Set();

        const result = await getDirectMessages(otherUser.id, undefined, {
          authedFetch,
        });
        const ui = result.messages.map((m) => ({
          id: m.id,
          fromUserId: m.fromUserId,
          toUserId: m.toUserId,
          text: m.text,
          mediaItems: m.mediaItems,
          price: typeof m.price === "number" ? m.price : undefined,
          isUnlocked:
            typeof m.isUnlocked === "boolean" ? m.isUnlocked : undefined,
          deleted: m.deleted === true,
          createdAt: m.createdAt,
        }));

        ui.forEach((m) => messageIdsRef.current.add(m.id));
        setMessages(ui);
        setNextCursor(result.nextCursor);

        // Best-effort: opening the thread marks it read.
        void markMessageThreadRead(otherUser.id, { authedFetch });

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

    const wsUrl = getMessagesWebSocketUrl(otherUser.id, token);
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

        if (parsed.type === "dmDeleted") {
          if (typeof parsed.id !== "string") return;
          const id = parsed.id;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? {
                    ...m,
                    deleted: true,
                    text: "",
                    mediaItems: [],
                    price: undefined,
                    isUnlocked: false,
                  }
                : m
            )
          );
          return;
        }

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
              deleted: false,
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
          void markMessageThreadRead(otherUser.id, { authedFetch });
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
      const result = await getDirectMessages(otherUser.id, nextCursor, {
        authedFetch,
      });

      const ui = result.messages.map((m) => ({
        id: m.id,
        fromUserId: m.fromUserId,
        toUserId: m.toUserId,
        text: m.text,
        mediaItems: m.mediaItems,
        price: typeof m.price === "number" ? m.price : undefined,
        isUnlocked:
          typeof m.isUnlocked === "boolean" ? m.isUnlocked : undefined,
        deleted: m.deleted === true,
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

      const created = await sendDirectMessage(
        otherUser.id,
        {
          text: draft,
          mediaFiles:
            canUploadMedia && newMediaFiles.length > 0 ? newMediaFiles : null,
          price: parsedPrice,
        },
        { authedFetch }
      );

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
              deleted: false,
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
          <Link to="/me/messages">Back to messages</Link>
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
      <section className={styles.actions} style={{ marginBottom: "1rem" }}>
        <Link to="/me/messages">Back</Link>
        <p className="text-muted" style={{ margin: 0, flex: 1 }}>
          <Link
            to={`/${encodeURIComponent(otherUser.userName)}`}
            title="View profile"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {otherUser.displayName || otherUser.userName} | @
            {otherUser.userName}
          </Link>
        </p>
        {currentUser && isSubscribed && (
          <button
            type="button"
            className="auth-submit"
            onClick={() => {
              setTipError(null);
              setTipAmount("");
              setShowTipDialog(true);
            }}
            style={{
              width: "auto",
              marginTop: 0,
              padding: "0.4rem 0.8rem",
              fontSize: "0.9rem",
            }}
          >
            💝 Send Tip
          </button>
        )}
      </section>

      {error && <p className="auth-error">{error}</p>}

      <section
        className={`app-card ${styles.card}`}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          className={styles.list}
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
              const isDeleted = m.deleted === true;
              let mediaLength =
                !isDeleted && m.mediaItems ? m.mediaItems.length : 0;
              let mediaGridColumns = mediaLength === 1 ? 1 : mediaLength;

              if (mediaLength > 4) {
                mediaGridColumns = 3;
              }

              return (
                <div
                  key={m.id}
                  className={`${styles.row} ${isMine ? styles.rowMine : ""}`}
                >
                  {!isMine ? (
                    <Link
                      to={`/${encodeURIComponent(otherUser.userName)}`}
                      title="View profile"
                      style={{ textDecoration: "none" }}
                      aria-label={`View ${
                        otherUser.displayName || otherUser.userName
                      } profile`}
                    >
                      <span className={styles.avatar} aria-hidden="true">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ position: "absolute" }}
                        >
                          <path
                            d="M20 21a8 8 0 0 0-16 0"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {otherAvatarSrc ? (
                          <img
                            src={otherAvatarSrc}
                            alt=""
                            loading="lazy"
                            draggable={false}
                            className={styles.avatarImg}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                      </span>
                    </Link>
                  ) : null}
                  <div
                    className={styles.bubble}
                    style={{ position: "relative" }}
                  >
                    {canDeleteMessages && isMine && !isDeleted ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteMessageTarget(m);
                        }}
                        title="Delete message"
                        aria-label="Delete message"
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          zIndex: 50,
                          width: "18px",
                          height: "18px",
                          borderRadius: "999px",
                          border: "1px solid rgba(255,255,255,0.18)",
                          background: "rgba(0,0,0,0.25)",
                          color: "rgba(255,255,255,0.9)",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          style={{ position: "absolute" }}
                        >
                          <path
                            d="M3 6h18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M8 6V4h8v2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M6 6l1 16h10l1-16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 11v6M14 11v6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    ) : null}

                    {isDeleted ? (
                      <div
                        className="text-muted"
                        style={{ fontStyle: "italic" }}
                      >
                        Message deleted
                      </div>
                    ) : (
                      <div>{m.text}</div>
                    )}

                    {!isDeleted &&
                    Array.isArray(m.mediaItems) &&
                    m.mediaItems.length > 0 ? (
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
                      <div className={styles.meta}>
                        {formatMessageTime(m.createdAt)}
                        {typeof m.price === "number" &&
                        Number.isFinite(m.price) &&
                        m.price > 0 &&
                        !isDeleted ? (
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
              await purchaseDirectMessageMedia(
                {
                  messageId: payMessage.id,
                  paymentProfileId,
                  cardInfo,
                },
                { authedFetch }
              );

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

        <Lightbox
          isOpen={!!deleteMessageTarget}
          onClose={() => {
            if (isDeleting) return;
            setDeleteMessageTarget(null);
            setDeleteError(null);
          }}
          zIndex={1200}
        >
          {deleteMessageTarget ? (
            <div
              className="app-card"
              style={{
                width: "min(92vw, 420px)",
                padding: "1rem",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
                Delete message?
              </h3>
              <p className="text-muted" style={{ marginTop: 0 }}>
                This removes the message for both users.
              </p>

              {deleteError ? <p className="auth-error">{deleteError}</p> : null}

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="auth-submit"
                  style={{ width: "auto", marginTop: 0, opacity: 0.9 }}
                  onClick={() => {
                    if (isDeleting) return;
                    setDeleteMessageTarget(null);
                    setDeleteError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="auth-submit"
                  style={{
                    width: "auto",
                    marginTop: 0,
                    background: "rgba(239,68,68,0.9)",
                    borderColor: "rgba(239,68,68,0.95)",
                  }}
                  disabled={isDeleting}
                  onClick={async () => {
                    try {
                      if (!deleteMessageTarget) return;
                      setDeleteError(null);
                      setIsDeleting(true);
                      await deleteDirectMessage(deleteMessageTarget.id, {
                        authedFetch,
                      });
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === deleteMessageTarget.id
                            ? {
                                ...m,
                                deleted: true,
                                text: "",
                                mediaItems: [],
                                price: undefined,
                                isUnlocked: false,
                              }
                            : m
                        )
                      );
                      setDeleteMessageTarget(null);
                    } catch (err) {
                      const message =
                        (err instanceof Error && err.message) ||
                        "Failed to delete message.";
                      setDeleteError(message);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ) : null}
        </Lightbox>

        {/* Tip Amount Selection Dialog */}
        <Lightbox
          isOpen={showTipDialog}
          onClose={() => {
            setShowTipDialog(false);
            setTipError(null);
          }}
          zIndex={1200}
        >
          <div
            className="app-card"
            style={{
              width: "min(92vw, 480px)",
              padding: "1.25rem",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
              Send a Tip
            </h3>
            <p className="text-muted" style={{ marginTop: 0, marginBottom: "1rem" }}>
              Show your appreciation to{" "}
              {otherUser?.displayName || otherUser?.userName}
            </p>

            {tipError ? <p className="auth-error">{tipError}</p> : null}

            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="tip-amount"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                Select Amount ($1 - $200)
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {["5", "10", "20", "50", "100"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTipAmount(amt)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      border: tipAmount === amt ? "2px solid var(--primary-color)" : "1px solid rgba(255,255,255,0.18)",
                      background: tipAmount === amt ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
                      color: "var(--text-color)",
                      cursor: "pointer",
                      fontWeight: tipAmount === amt ? 600 : 400,
                      transition: "all 0.2s",
                    }}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <input
                id="tip-amount"
                type="number"
                placeholder="Or enter custom amount"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                min="1"
                max="200"
                step="1"
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--text-color)",
                  fontSize: "1rem",
                }}
              />
              {tipAmount && (parseFloat(tipAmount) < 1 || parseFloat(tipAmount) > 200) ? (
                <p
                  style={{
                    marginTop: "0.5rem",
                    marginBottom: 0,
                    fontSize: "0.85rem",
                    color: "#f87171",
                  }}
                >
                  {parseFloat(tipAmount) < 1
                    ? "⚠️ Tip amount must be at least $1"
                    : "⚠️ Tip amount cannot exceed $200"}
                </p>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="auth-submit"
                style={{ width: "auto", marginTop: 0, opacity: 0.9 }}
                onClick={() => {
                  setShowTipDialog(false);
                  setTipError(null);
                  setTipAmount("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="auth-submit"
                style={{
                  width: "auto",
                  marginTop: 0,
                }}
                disabled={!tipAmount || parseFloat(tipAmount) < 1 || parseFloat(tipAmount) > 200}
                onClick={() => {
                  setTipError(null);
                  setShowTipDialog(false);
                  setShowTipPayment(true);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </Lightbox>

        {/* Tip Payment Selection Dialog */}
        <PayToViewPaymentModal
          isOpen={showTipPayment}
          amount={parseFloat(tipAmount) || 0}
          onClose={() => {
            if (isSendingTip) return;
            setShowTipPayment(false);
            setTipError(null);
          }}
          isConfirmLoading={isSendingTip}
          errorMessage={tipError}
          onConfirm={async ({ paymentProfileId, cardInfo }) => {
            if (!otherUser) return;
            try {
              setTipError(null);
              setIsSendingTip(true);
              await sendTip(
                {
                  userId: otherUser.id,
                  amount: parseFloat(tipAmount),
                  paymentProfileId,
                  cardInfo,
                },
                { authedFetch }
              );

              setShowTipPayment(false);
              setTipAmount("");
              // Show success message
              alert(`Tip of $${tipAmount} sent successfully!`);
            } catch (err) {
              const message =
                (err instanceof Error && err.message) ||
                "Failed to send tip.";
              setTipError(message);
            } finally {
              setIsSendingTip(false);
            }
          }}
        />
      </section>
    </main>
  );
}
