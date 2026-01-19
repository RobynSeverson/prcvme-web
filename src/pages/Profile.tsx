import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ReactGA from "react-ga4";
import type { SubscriptionDeal, User } from "../models/user";
import UserPosts from "../components/UserPosts";
import UserMediaGrid from "../components/UserMediaGrid";
import {
  getMySubscription,
  getUserByUserName,
  subscribeToUser,
  unsubscribeFromUser,
  getProfileAPIBase,
} from "../helpers/api/apiHelpers";
import SubscribePaymentModal from "../components/SubscribePaymentModal";
import Lightbox from "../components/Lightbox";
import LikeBookmarkButtons from "../components/LikeBookmarkButtons";
import Deal from "../components/Deal";
import { buildProfileImageUrl } from "../helpers/userHelpers";
import { useCurrentUser } from "../context/CurrentUserContext";
import styles from "./Profile.module.css";

export default function Profile({ userName }: { userName?: string }) {
  const {
    user: loggedInUser,
    isAuthenticated,
    authedFetch,
    refreshCurrentUser,
  } = useCurrentUser();
  const isLoggedIn = isAuthenticated;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [accessUntil, setAccessUntil] = useState<string | null>(null);
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isUnsubscribeModalOpen, setIsUnsubscribeModalOpen] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [unsubscribeError, setUnsubscribeError] = useState<string | null>(null);
  const [postsReloadToken, setPostsReloadToken] = useState(0);
  const [contentTab, setContentTab] = useState<"posts" | "media">("posts");
  const [isProfileImageLightboxOpen, setIsProfileImageLightboxOpen] =
    useState(false);
  const [postStats, setPostStats] = useState<{
    postCount: number;
    imageCount: number;
    videoCount: number;
  } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const loginLink = `/account/login?redirect=${encodeURIComponent(
    location.pathname + location.search
  )}`;

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        setPostStats(null);
        setContentTab("posts");

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
          if (!isAuthenticated) {
            setError("You need to be signed in to view your profile.");
            return;
          }

          try {
            if (loggedInUser) {
              setUser(loggedInUser);
            } else {
              const me = await refreshCurrentUser();
              setUser(me);
            }
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
  }, [userName, isAuthenticated, loggedInUser, refreshCurrentUser]);

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

        const result = await getMySubscription(user.id, { authedFetch });
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
  }, [authedFetch, user, isLoggedIn, isOwner]);

  const refreshSubscriptionStatus = async () => {
    if (!user) return;
    if (!isLoggedIn) return;
    if (isOwner) return;

    const result = await getMySubscription(user.id, { authedFetch });
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
    navigate("/me/profile/edit");
  };

  const handleShareProfile = async () => {
    if (!user) return;
    if (typeof window === "undefined") return;

    const apiBaseUrl = getProfileAPIBase().replace(/\/$/, "");
    const url = `${apiBaseUrl}/u/${encodeURIComponent(user.userName)}`;

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

    ReactGA.event({
      category: "User Interaction",
      action: `Clicked ${isSubscribed ? "Unsubscribe" : "Subscribe"} Button`,
      label: userName || "Unknown Profile",
    });

    if (!isLoggedIn) {
      navigate(loginLink);
      return;
    }

    if (!isSubscribed) {
      setSubError(null);
      setSelectedDealId(null);
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
    setSelectedDealId(null);
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
      await subscribeToUser(
        user.id,
        {
          ...args,
          dealId: selectedDealId ?? undefined,
        },
        { authedFetch }
      );
      await refreshSubscriptionStatus();
      setPostsReloadToken((prev) => prev + 1);
      setIsPaymentModalOpen(false);
      setSelectedDealId(null);
    } catch (err) {
      const message =
        (err instanceof Error && err.message) || "Failed to subscribe.";
      setSubError(message);
    } finally {
      setIsSubLoading(false);
    }
  };

  // Deals/discounts must be derived before any early returns to keep hook order stable.
  const sortedDeals = useMemo<SubscriptionDeal[]>(() => {
    const deals = Array.isArray(user?.subscriptionDeals)
      ? (user?.subscriptionDeals as SubscriptionDeal[])
      : ([] as SubscriptionDeal[]);

    return [...deals].sort((a, b) => {
      const am = typeof a.months === "number" ? a.months : 0;
      const bm = typeof b.months === "number" ? b.months : 0;
      return am - bm;
    });
  }, [user?.subscriptionDeals]);

  const hasDeals = sortedDeals.length > 0;

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

  const handleOpenProfileImage = () => {
    if (!profilePictureSrc) return;
    setIsProfileImageLightboxOpen(true);
  };

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

  const handleSelectDealSubscribe = async (dealId: string) => {
    if (!user) return;
    if (isOwner) return;

    ReactGA.event({
      category: "User Interaction",
      action: "Clicked Subscribe Deal",
      label: `${userName || "Unknown Profile"} | ${dealId}`,
    });

    if (!isLoggedIn) {
      navigate(loginLink);
      return;
    }

    setSubError(null);
    setSelectedDealId(dealId);
    setIsPaymentModalOpen(true);
  };

  const now = new Date();
  const accessUntilDate = accessUntil ? new Date(accessUntil) : null;
  const hasPaidThroughAccess =
    !isSubscriptionActive &&
    isSubscribed &&
    accessUntilDate instanceof Date &&
    !Number.isNaN(accessUntilDate.getTime()) &&
    accessUntilDate.getTime() > now.getTime();

  const canMessageUser =
    !isOwner &&
    isLoggedIn &&
    (isSubscribed || hasPaidThroughAccess) &&
    typeof user.userName === "string" &&
    user.userName.length > 0;

  const formatCountLabel = (count: number, singular: string) => {
    const safeCount = Number.isFinite(count) ? count : 0;
    return `${safeCount} ${singular}${safeCount === 1 ? "" : "s"}`;
  };

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
              display: "block",
              width: "100%",
              height: "160px",
              objectFit: "cover",
              borderRadius: "0.75rem",
              userSelect: isOwner ? undefined : "none",
              WebkitTouchCallout: isOwner ? undefined : "none",
            }}
          />
        )}

        {profileBackgroundSrc && !isOwner && user.id ? (
          <div
            aria-label="Profile actions"
            className={styles.profileHeaderPill}
            style={{
              position: "absolute",
              right: "0.75rem",
              bottom: "0.75rem",
              zIndex: 2,
            }}
          >
            <LikeBookmarkButtons
              targetType="profile"
              targetId={user.id}
              size={22}
              showCounts={true}
            />
          </div>
        ) : null}

        {profileBackgroundSrc && postStats ? (
          <div
            aria-label="Profile post stats"
            className={`${styles.profileHeaderPill} ${styles.profileStatsPill}`}
            style={{
              position: "absolute",
              top: "0.75rem",
              right: "0.75rem",
              pointerEvents: "auto",
            }}
          >
            <span
              title={formatCountLabel(postStats.postCount, "post")}
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
              title={formatCountLabel(postStats.imageCount, "image")}
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
              title={formatCountLabel(postStats.videoCount, "video")}
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
            onClick={handleOpenProfileImage}
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
              cursor: "pointer",
            }}
          />
        )}
      </section>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        {!isOwner && (!hasDeals || isSubscribed) && (
          <button
            type="button"
            onClick={handleSubscribeToggle}
            className="auth-submit"
            disabled={isSubLoading || isUnsubscribing}
            style={{ width: "auto" }}
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
            style={{ width: "auto" }}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            {canMessageUser ? (
              <Link
                to={`/me/messages/${encodeURIComponent(user.userName)}`}
                className="icon-button"
                aria-label={`Message ${user.displayName || user.userName}`}
                title="Message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 12a8 8 0 0 1-8 8H8l-5 2 2-5v-5a8 8 0 0 1 8-8h0a8 8 0 0 1 8 8Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 12h8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 16h5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            ) : null}

            {/* If there is no background image, keep the profile actions here as a fallback. */}
            {!profileBackgroundSrc && !isOwner && user.id && (
              <LikeBookmarkButtons
                targetType="profile"
                targetId={user.id}
                size={22}
                showCounts={true}
              />
            )}
          </div>
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

      {subError && <p className="auth-error">{subError}</p>}

      {!isOwner && hasPaidThroughAccess && accessUntilDate ? (
        <p className="text-muted" style={{ marginTop: "0.25rem" }}>
          Cancelled • active until {accessUntilDate.toLocaleDateString()}
        </p>
      ) : null}

      {!isOwner && hasDeals && !isSubscribed && (
        <section
          style={{
            border: "1px solid var(--border-color)",
            borderRadius: "0.75rem",
            backgroundColor: "var(--bg-secondary-color)",
          }}
        >
          <ul style={{ paddingLeft: 0, marginTop: 0, marginBottom: 0 }}>
            {sortedDeals.map((deal) => {
              return (
                <Deal
                  key={deal.dealId}
                  deal={deal}
                  monthlyPrice={user.subscriptionPrice}
                  creatorProfilePictureSrc={profilePictureSrc}
                  isSubscribed={isSubscribed}
                  isSubLoading={isSubLoading}
                  isUnsubscribing={isUnsubscribing}
                  onSubscribe={(dealId) => {
                    void handleSelectDealSubscribe(dealId);
                  }}
                  styles={styles}
                />
              );
            })}
          </ul>
        </section>
      )}

      <section>
        {isLoggedIn ? (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1.25rem",
              borderBottom: "1px solid var(--border-color)",
              paddingBottom: "0.75rem",
            }}
          >
            {(["posts", "media"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setContentTab(tab)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  fontWeight: contentTab === tab ? 700 : 400,
                  color:
                    contentTab === tab
                      ? "var(--primary-color)"
                      : "var(--text-muted)",
                  borderBottom:
                    contentTab === tab
                      ? "2px solid var(--primary-color)"
                      : "2px solid transparent",
                  marginBottom: "-0.8rem",
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                {tab === "posts" ? "Posts" : "Media"}
              </button>
            ))}
          </div>
        ) : null}

        {contentTab === "media" && isLoggedIn ? (
          <UserMediaGrid
            userId={user.id}
            userName={userName}
            protectContent={!isOwner && !isSubscribed}
            isOwner={isOwner}
            reloadToken={postsReloadToken}
            onStats={(stats) => setPostStats(stats)}
          />
        ) : (
          <UserPosts
            userId={user.id}
            userName={userName}
            protectContent={!isOwner && !isSubscribed && !loggedInUser?.isAdmin}
            isOwner={isOwner}
            reloadToken={postsReloadToken}
            onStats={(stats) => setPostStats(stats)}
          />
        )}
      </section>

      <SubscribePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedDealId(null);
        }}
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

                  await unsubscribeFromUser(user.id, { authedFetch });
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

      <Lightbox
        isOpen={isProfileImageLightboxOpen}
        onClose={() => setIsProfileImageLightboxOpen(false)}
        zIndex={2600}
      >
        <div
          className="app-card"
          style={{
            width: "min(860px, 96vw)",
            padding: "0.75rem",
            borderRadius: "1rem",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          {profilePictureSrc ? (
            <img
              src={profilePictureSrc}
              alt={`${user.displayName || user.userName} profile`}
              draggable={false}
              onContextMenu={isOwner ? undefined : (e) => e.preventDefault()}
              onDragStart={isOwner ? undefined : (e) => e.preventDefault()}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "0.75rem",
                userSelect: isOwner ? undefined : "none",
                WebkitTouchCallout: isOwner ? undefined : "none",
              }}
            />
          ) : null}
        </div>
      </Lightbox>
    </main>
  );
}
