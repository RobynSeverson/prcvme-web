import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  getDirectMessages,
  getMessagesWebSocketUrl,
  getUserByUserName,
} from "../helpers/api/apiHelpers";
import type { User } from "../models/user";
import {
  getLoggedInUserFromStorage,
  isUserLoggedIn,
} from "../helpers/auth/authHelpers";

type UiMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  createdAt: string;
};

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

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());

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
          createdAt: m.createdAt,
        }));

        ui.forEach((m) => messageIdsRef.current.add(m.id));
        setMessages(ui);
        setNextCursor(result.nextCursor);
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
        const createdAt = parsed.timestamp ?? new Date().toISOString();

        if (messageIdsRef.current.has(id)) {
          return;
        }

        messageIdsRef.current.add(id);
        setMessages((prev) => [
          ...prev,
          {
            id,
            fromUserId,
            toUserId,
            text,
            createdAt,
          },
        ]);
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

    try {
      setIsLoadingMessages(true);
      const result = await getDirectMessages(otherUser.id, nextCursor);

      const ui = result.messages.map((m) => ({
        id: m.id,
        fromUserId: m.fromUserId,
        toUserId: m.toUserId,
        text: m.text,
        createdAt: m.createdAt,
      }));

      ui.forEach((m) => messageIdsRef.current.add(m.id));
      setMessages((prev) => [...ui, ...prev]);
      setNextCursor(result.nextCursor);
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        "Failed to load older messages.";
      setError(message);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!otherUser) return;

    const text = draft.trim();
    if (!text) return;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setError("Realtime connection not ready. Try again in a moment.");
      return;
    }

    try {
      setError(null);
      setIsSending(true);
      ws.send(
        JSON.stringify({
          type: "dm",
          toUserId: otherUser.id,
          text,
        })
      );
      setDraft("");
    } finally {
      setIsSending(false);
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
    <main>
      <section style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginBottom: "0.25rem" }}>
          Messages with {otherUser.displayName || otherUser.userName}
        </h2>
        <p className="text-muted" style={{ margin: 0 }}>
          @{otherUser.userName}
        </p>
      </section>

      {error && <p className="auth-error">{error}</p>}

      <section className="app-card" style={{ padding: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            type="button"
            className="auth-submit"
            style={{ width: "auto" }}
            onClick={loadOlder}
            disabled={!nextCursor || isLoadingMessages}
          >
            {nextCursor ? "Load older" : "No more"}
          </button>
          <Link to="/messages">Back</Link>
        </div>

        <div style={{ marginTop: "1rem" }}>
          {isLoadingMessages && messages.length === 0 ? (
            <p>Loading...</p>
          ) : messages.length === 0 ? (
            <p className="text-muted">No messages yet.</p>
          ) : (
            messages.map((m) => {
              const isMine = !!meUserId && m.fromUserId === meUserId;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: isMine ? "flex-end" : "flex-start",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "12px",
                      background: isMine
                        ? "rgba(102, 126, 234, 0.25)"
                        : "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.text}
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
      </section>
    </main>
  );
}
