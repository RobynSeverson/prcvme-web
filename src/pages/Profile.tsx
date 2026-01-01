import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "../models/user";
import UserPosts from "../components/UserPosts";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Profile({ userName }: { userName?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.localStorage.getItem("authToken")
  );
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (userName) {
          const response = await fetch(
            `${API_BASE}/users/${encodeURIComponent(userName)}`
          );

          const data = await response.json().catch(() => null);

          if (!response.ok) {
            const message =
              (data && typeof data.error === "string" && data.error) ||
              "Failed to load profile.";
            setError(message);
            return;
          }

          if (data && data.user) {
            const loadedUser = data.user as User;
            setUser(loadedUser);
          }
        } else {
          const token = window.localStorage.getItem("authToken");

          if (!token) {
            setError("You need to be signed in to view your profile.");
            return;
          }

          const response = await fetch(`${API_BASE}/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json().catch(() => null);

          if (!response.ok) {
            const message =
              (data && typeof data.error === "string" && data.error) ||
              "Failed to load profile.";
            setError(message);
            if (response.status === 401 || response.status === 404) {
              window.localStorage.removeItem("authToken");
              window.localStorage.removeItem("authUser");
            }
            return;
          }

          if (data && data.user) {
            const loadedUser = data.user as User;
            setUser(loadedUser);
            window.localStorage.setItem("authUser", JSON.stringify(loadedUser));
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
    setIsLoggedIn(!!window.localStorage.getItem("authToken"));
  }, []);

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
          <Link to="/login">Go to login</Link>
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

  const buildImageUrl = (imageId?: string | null) => {
    if (!imageId) return undefined;
    if (imageId.startsWith("http://") || imageId.startsWith("https://")) {
      return imageId;
    }
    return `${API_BASE}/users/${user.id}/profile/${imageId}`;
  };

  const profilePictureSrc = buildImageUrl(user.profilePictureUrl);
  const profileBackgroundSrc = buildImageUrl(user.profileBackgroundUrl);

  return (
    <main>
      <section
        style={{
          position: "relative",
          marginBottom: "3rem",
          borderRadius: "0.75rem",
          border: "1px solid rgba(148, 163, 184, 0.4)",
          minHeight: "160px",
          background: "radial-gradient(circle at top left, #1f2937, #020617)",
        }}
      >
        {profileBackgroundSrc && (
          <img
            src={profileBackgroundSrc}
            alt="Profile background"
            style={{ width: "100%", height: "160px", objectFit: "cover" }}
          />
        )}

        {profilePictureSrc && (
          <img
            src={profilePictureSrc}
            alt="Profile"
            style={{
              position: "absolute",
              left: "1.5rem",
              bottom: "-2.5rem",
              width: "80px",
              height: "80px",
              borderRadius: "999px",
              objectFit: "cover",
              border: "3px solid #020617",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              backgroundColor: "#020617",
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
            color: "#9ca3af",
            fontSize: "0.9rem",
          }}
        >
          @{user.userName}
        </p>
        {user.bio && (
          <p
            style={{
              marginTop: "0.5rem",
              color: "#d1d5db",
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
        {!userName && (
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

      <section>
        <hr />
        {isLoggedIn ? (
          <UserPosts userId={user.id} userName={userName} />
        ) : (
          <p>
            You need to log in to view posts.{" "}
            <Link to="/login">Go to login</Link>
          </p>
        )}
      </section>
    </main>
  );
}
