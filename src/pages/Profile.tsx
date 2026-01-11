import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { User } from "../models/user";
import UserPosts from "../components/UserPosts";
import {
  getCurrentUser,
  getMySubscription,
  getUserByUserName,
  subscribeToUser,
  unsubscribeFromUser,
} from "../helpers/api/apiHelpers";
import SubscribePaymentModal from "../components/SubscribePaymentModal";
import Lightbox from "../components/Lightbox";
import LikeBookmarkButtons from "../components/LikeBookmarkButtons";
import { buildProfileImageUrl } from "../helpers/userHelpers";
import {
  getLoggedInUserFromStorage,
  isUserLoggedIn,
} from "../helpers/auth/authHelpers";

export default function Profile({ userName }: { userName?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [accessUntil, setAccessUntil] = useState<string | null>(null);
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUnsubscribeModalOpen, setIsUnsubscribeModalOpen] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [unsubscribeError, setUnsubscribeError] = useState<string | null>(null);
  const [postsReloadToken, setPostsReloadToken] = useState(0);
  const [postStats, setPostStats] = useState<{
    postCount: number;
    imageCount: number;
    videoCount: number;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.localStorage.getItem("authToken")
  );
  const navigate = useNavigate();
  const location = useLocation();

  const loginLink = `/login?redirect=${encodeURIComponent(
    location.pathname + location.search
  )}`;

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        setPostStats(null);

        if (userName) {
          try {
            const userByUserName = await getUserByUserName(userName);

            if (userByUserName) {
              setUser(userByUserName);
            }
          } catch (error) {
            const message =
              (typeof error === "string" && error) || "Failed to load profile.";
            setError(message);
            return;
          }
        } else {
          if (!isUserLoggedIn()) {
            setError("You need to be signed in to view your profile.");
            return;
          }

          try {
            const currentUser = await getCurrentUser();

            setUser(currentUser);
          } catch (error) {
            const message =
              (typeof error === "string" && error) || "Failed to load profile.";
            setError(message);
          }
        }
      } catch (err) {
        console.error("Error loading profile", err);
        setError("Something went wrong while loading your profile.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, [userName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsLoggedIn(isUserLoggedIn());
    setLoggedInUser(getLoggedInUserFromStorage());
  }, []);

  const isOwner =
    !!loggedInUser?.id && !!user?.id && loggedInUser.id === user.id;

  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      if (!user) return;
      if (!isLoggedIn) return;
      if (isOwner) return;

      try {
        setSubError(null);
        setIsSubLoading(true);

        const result = await getMySubscription(user.id);
        const subscribed = !!result.subscribed;
        const isActive = !!(result.subscription
          ? result.subscription.isActive !== false
          : subscribed);
        const nextAccessUntil =
          result.subscription &&
          typeof result.subscription.accessUntil === "string"
            ? result.subscription.accessUntil
            : null;

        setIsSubscribed(subscribed);
        setIsSubscriptionActive(subscribed && isActive);
        setAccessUntil(nextAccessUntil);
      } catch (err) {
        const message =
          (err instanceof Error && err.message) ||
          "Failed to load subscription status.";
        setSubError(message);
        setIsSubscribed(false);
        setIsSubscriptionActive(false);
        setAccessUntil(null);
      } finally {
        setIsSubLoading(false);
      }
    };

    void loadSubscriptionStatus();
  }, [user, isLoggedIn, isOwner]);

  const refreshSubscriptionStatus = async () => {
    if (!user) return;
    if (!isLoggedIn) return;
    if (isOwner) return;

    const result = await getMySubscription(user.id);
    const subscribed = !!result.subscribed;
    const isActive = !!(result.subscription
      ? result.subscription.isActive !== false
      : subscribed);
    const nextAccessUntil =
      result.subscription && typeof result.subscription.accessUntil === "string"
        ? result.subscription.accessUntil
        : null;

    setIsSubscribed(subscribed);
    setIsSubscriptionActive(subscribed && isActive);
    setAccessUntil(nextAccessUntil);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) return;
    if (isOwner) return;

    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof HTMLImageElement) {
        event.preventDefault();
      }
    };

    const handleDragStart = (event: DragEvent) => {
      const target = event.target;
      if (target instanceof HTMLImageElement) {
        event.preventDefault();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Best-effort: block common “save/print” shortcuts while on someone else’s profile.
      const key = event.key.toLowerCase();
      const metaOrCtrl = event.metaKey || event.ctrlKey;
      if (metaOrCtrl && (key === "s" || key === "p")) {
        event.preventDefault();
        return;
      }

      // Best-effort: attempt to block screenshot hotkeys (OS-level capture may still occur).
      if (event.key === "PrintScreen") {
        event.preventDefault();
        return;
      }

      // macOS screenshot shortcuts: Cmd+Shift+3/4/5
      if (
        event.metaKey &&
        event.shiftKey &&
        (key === "3" || key === "4" || key === "5")
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("dragstart", handleDragStart, true);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOwner, user]);

  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  const handleShareProfile = async () => {
    if (!user) return;
    if (typeof window === "undefined") return;

    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${user.userName}`;

    const setCopiedFeedback = () => {
      setCopyStatus("copied");
      window.setTimeout(() => {
        setCopyStatus("idle");
      }, 1600);
    };

    const tryLegacyCopy = (text: string): boolean => {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        return ok;
      } catch {
        return false;
      }
    };

    try {
      // 1) Modern clipboard (often fails on mobile Safari / non-HTTPS).
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(url);
        setCopiedFeedback();
        return;
      }

      // 2) Legacy copy fallback.
      if (tryLegacyCopy(url)) {
        setCopiedFeedback();
        return;
      }

      // 3) Mobile-friendly fallback: open share sheet (includes Copy on iOS).
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: user.displayName || user.userName,
          text: "Profile link",
          url,
        });
        return;
      }

      // 4) Last resort: prompt so the user can manually copy.
      window.prompt("Copy this profile link:", url);
    } catch (err) {
      // If clipboard fails (common on mobile), try share sheet, then prompt.
      try {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: user.displayName || user.userName,
            text: "Profile link",
            url,
          });
          return;
        }
      } catch {
        // ignore
      }

      try {
        window.prompt("Copy this profile link:", url);
      } catch {
        // ignore
      }

      console.error("Failed to copy profile link", err);
    }
  };

  const handleSubscribeToggle = async () => {
    if (!user) return;
    if (isOwner) return;
    if (!isLoggedIn) {
      navigate(loginLink);
      return;
    }

    if (!isSubscribed) {
      setSubError(null);
      setIsPaymentModalOpen(true);
      return;
    }

    // If they're currently active, confirm before cancel.
    if (isSubscriptionActive) {
      setUnsubscribeError(null);
      setIsUnsubscribeModalOpen(true);
      return;
    }

    // Cancelled-but-paid-through: show "Resubscribe" and reopen the payment modal.
    setSubError(null);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmSubscribe = async (args?: {
    paymentProfileId?: string;
    cardInfo?: {
      nameOnCard: string;
      cardNumber: string;
      expirationDate: string;
      cardCode?: string;
    };
  }) => {
    if (!user) return;
    if (isOwner) return;
    if (!isLoggedIn) {
      navigate(loginLink);
      return;
    }

    try {
      setSubError(null);
      setIsSubLoading(true);
      await subscribeToUser(user.id, args);
      await refreshSubscriptionStatus();
      setPostsReloadToken((prev) => prev + 1);
      setIsPaymentModalOpen(false);
    } catch (err) {
      const message =
        (err instanceof Error && err.message) || "Failed to subscribe.";
      setSubError(message);
    } finally {
      setIsSubLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main>
        <p>Loading profile...</p>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main>
        <p>{error}</p>
        <p>
          <Link to={loginLink}>Go to login</Link>
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <p>Profile information is not available.</p>
      </main>
    );
  }

  const profilePictureSrc = buildProfileImageUrl(
    user.id,
    user.profilePictureUrl
  );
  const profileBackgroundSrc = buildProfileImageUrl(
    user.id,
    user.profileBackgroundUrl
  );

  const formatMonthlyPrice = (price: number) => {
    if (!Number.isFinite(price)) return null;
    return `$${price.toFixed(2)}/mo`;
  };

  const subscribeLabel = () => {
    const priceLabel =
      typeof user.subscriptionPrice === "number"
        ? formatMonthlyPrice(user.subscriptionPrice)
        : null;

    if (!priceLabel) return "Subscribe";
    return `Subscribe (${priceLabel})`;
  };

  const now = new Date();
  const accessUntilDate = accessUntil ? new Date(accessUntil) : null;
  const hasPaidThroughAccess =
    !isSubscriptionActive &&
    isSubscribed &&
    accessUntilDate instanceof Date &&
    !Number.isNaN(accessUntilDate.getTime()) &&
    accessUntilDate.getTime() > now.getTime();

  return (
    <main style={{ position: "relative" }}>
      {!isOwner && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 9999,
            opacity: 0.14,
            mixBlendMode: "multiply",
          }}
        />
      )}
      <section className="app-card profile-header-card">
        {profileBackgroundSrc && (
          <img
            src={profileBackgroundSrc}
            alt="Profile background"
            draggable={false}
            onContextMenu={isOwner ? undefined : (e) => e.preventDefault()}
            onDragStart={isOwner ? undefined : (e) => e.preventDefault()}
            style={{
              width: "100%",
              height: "160px",
              objectFit: "cover",
              userSelect: isOwner ? undefined : "none",
              WebkitTouchCallout: isOwner ? undefined : "none",
            }}
          />
        )}

        {profileBackgroundSrc && postStats ? (
          <div
            aria-label="Profile post stats"
            style={{
              position: "absolute",
              top: "0.75rem",
              right: "0.75rem",
              display: "inline-flex",
              gap: "0.4rem",
              padding: "0.4rem 0.55rem",
              borderRadius: "999px",
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: "rgba(255,255,255,0.92)",
              fontSize: "0.85rem",
              fontWeight: 600,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
              >
                <path
                  d="M7 7h10M7 12h10M7 17h6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8l-3 2v-2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              {postStats.postCount}
            </span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
              >
                <path
                  d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M8 14l2.5-3 2.5 3 2-2 3 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 9.5h.01"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              {postStats.imageCount}
            </span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
              >
                <path
                  d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M10 9l6 3-6 3V9z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              {postStats.videoCount}
            </span>
          </div>
        ) : null}

        {profilePictureSrc && (
          <img
            src={profilePictureSrc}
            alt="Profile"
            draggable={false}
            onContextMenu={isOwner ? undefined : (e) => e.preventDefault()}
            onDragStart={isOwner ? undefined : (e) => e.preventDefault()}
            style={{
              position: "absolute",
              left: "1.5rem",
              bottom: "-2.5rem",
              width: "80px",
              height: "80px",
              borderRadius: "999px",
              objectFit: "cover",
              border: "3px solid var(--bg-color)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              backgroundColor: "var(--bg-color)",
              userSelect: isOwner ? undefined : "none",
              WebkitTouchCallout: isOwner ? undefined : "none",
            }}
          />
        )}
      </section>

      <section
        style={{
          marginBottom: "1.5rem",
          paddingLeft: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {user.displayName || user.userName}
            </p>
            <p
              style={{
                margin: "0.15rem 0",
                fontSize: "0.9rem",
              }}
              className="text-muted"
            >
              @{user.userName}
            </p>
          </div>
          {/* Like and Bookmark buttons for the profile */}
          {!isOwner && user.id && (
            <LikeBookmarkButtons
              targetType="profile"
              targetId={user.id}
              size={22}
              showCounts={true}
            />
          )}
        </div>
        {user.bio && (
          <p
            style={{
              marginTop: "0.5rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {user.bio}
          </p>
        )}
      </section>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1.5rem",
        }}
      >
        {!isOwner && (
          <button
            type="button"
            onClick={handleSubscribeToggle}
            className="auth-submit"
            disabled={isSubLoading || isUnsubscribing}
            style={{ width: "auto", marginRight: "0.5rem" }}
          >
            {!isLoggedIn
              ? subscribeLabel()
              : isSubLoading
              ? "Loading..."
              : isSubscribed
              ? isSubscriptionActive
                ? "Unsubscribe"
                : "Resubscribe"
              : subscribeLabel()}
          </button>
        )}
        {loggedInUser?.id === user.id && (
          <button
            type="button"
            onClick={handleEditProfile}
            className="auth-submit"
            style={{ width: "auto", marginRight: "0.5rem" }}
          >
            Edit profile
          </button>
        )}
        <button
          type="button"
          onClick={handleShareProfile}
          className="auth-submit"
          style={{ width: "auto" }}
        >
          {copyStatus === "copied" ? "Copied" : "Copy link"}
        </button>
      </div>

      {subError && <p className="auth-error">{subError}</p>}

      {!isOwner && hasPaidThroughAccess && accessUntilDate ? (
        <p className="text-muted" style={{ marginTop: "0.25rem" }}>
          Cancelled • active until {accessUntilDate.toLocaleDateString()}
        </p>
      ) : null}

      <section>
        <hr />
        <UserPosts
          userId={user.id}
          userName={userName}
          protectContent={!isOwner && !isSubscribed}
          isOwner={isOwner}
          reloadToken={postsReloadToken}
          onStats={(stats) => setPostStats(stats)}
        />
      </section>

      <SubscribePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        isConfirmLoading={isSubLoading}
        errorMessage={isPaymentModalOpen ? subError : null}
        onConfirm={(args) => {
          void handleConfirmSubscribe(args);
        }}
      />

      <Lightbox
        isOpen={isUnsubscribeModalOpen}
        onClose={() => {
          if (isUnsubscribing) return;
          setIsUnsubscribeModalOpen(false);
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
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
            Cancel subscription?
          </h3>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Are you sure you want to unsubscribe?
          </p>

          {accessUntilDate &&
          !Number.isNaN(accessUntilDate.getTime()) &&
          accessUntilDate.getTime() > now.getTime() ? (
            <p className="text-muted" style={{ marginTop: 0 }}>
              You’ll still have access until{" "}
              {accessUntilDate.toLocaleDateString()}.
            </p>
          ) : null}

          {unsubscribeError ? (
            <p className="auth-error">{unsubscribeError}</p>
          ) : null}

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
              onClick={() => setIsUnsubscribeModalOpen(false)}
              disabled={isUnsubscribing}
            >
              Keep
            </button>
            <button
              type="button"
              className="auth-submit"
              onClick={async () => {
                if (!user) return;
                if (isUnsubscribing) return;

                try {
                  setUnsubscribeError(null);
                  setIsUnsubscribing(true);

                  await unsubscribeFromUser(user.id);
                  await refreshSubscriptionStatus();

                  setIsUnsubscribeModalOpen(false);
                } catch (err) {
                  const message =
                    (err instanceof Error && err.message) ||
                    "Failed to unsubscribe.";
                  setUnsubscribeError(message);
                } finally {
                  setIsUnsubscribing(false);
                }
              }}
              disabled={isUnsubscribing}
              style={{ width: "auto", marginTop: 0 }}
            >
              {isUnsubscribing ? "Unsubscribing..." : "Unsubscribe"}
            </button>
          </div>
        </div>
      </Lightbox>
    </main>
  );
}
