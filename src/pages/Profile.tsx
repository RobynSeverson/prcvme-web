import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { User } from "../models/user";
import UserPosts from "../components/UserPosts";
import {
  getCurrentUser,
  getMySubscriptionStatus,
  getUserByUserName,
  subscribeToUser,
  unsubscribeFromUser,
} from "../helpers/api/apiHelpers";
import SubscribePaymentModal from "../components/SubscribePaymentModal";
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [postsReloadToken, setPostsReloadToken] = useState(0);
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
        const subscribed = await getMySubscriptionStatus(user.id);
        setIsSubscribed(subscribed);
      } catch (err) {
        const message =
          (err instanceof Error && err.message) ||
          "Failed to load subscription status.";
        setSubError(message);
      } finally {
        setIsSubLoading(false);
      }
    };

    void loadSubscriptionStatus();
  }, [user, isLoggedIn, isOwner]);

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

    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
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

    try {
      setSubError(null);
      setIsSubLoading(true);
      if (isSubscribed) {
        await unsubscribeFromUser(user.id);
        setIsSubscribed(false);
      } else {
        await subscribeToUser(user.id);
        setIsSubscribed(true);
        setPostsReloadToken((prev) => prev + 1);
      }
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        (isSubscribed ? "Failed to unsubscribe." : "Failed to subscribe.");
      setSubError(message);
    } finally {
      setIsSubLoading(false);
    }
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
      setIsSubscribed(true);
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
            disabled={isSubLoading}
            style={{ width: "auto", marginRight: "0.5rem" }}
          >
            {!isLoggedIn
              ? subscribeLabel()
              : isSubLoading
              ? isSubscribed
                ? "Unsubscribing..."
                : "Subscribing..."
              : isSubscribed
              ? "Unsubscribe"
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
          Copy profile link
        </button>
      </div>

      {subError && <p className="auth-error">{subError}</p>}

      <section>
        <hr />
        <UserPosts
          userId={user.id}
          userName={userName}
          protectContent={!isOwner && !isSubscribed}
          isOwner={isOwner}
          reloadToken={postsReloadToken}
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
    </main>
  );
}
