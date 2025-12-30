import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "../models/user";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = window.localStorage.getItem("authToken");

    if (!token) {
      setIsLoading(false);
      setError("You need to be signed in to view your profile.");
      return;
    }

    const loadUser = async () => {
      try {
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
      } catch (err) {
        console.error("Error loading profile", err);
        setError("Something went wrong while loading your profile.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, []);

  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  if (isLoading) {
    return (
      <main>
        <h1>Profile</h1>
        <p>Loading your profile...</p>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main>
        <h1>Profile</h1>
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
        <h1>Profile</h1>
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
      <h1>Profile</h1>

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

      <button
        type="button"
        onClick={handleEditProfile}
        className="auth-submit"
        style={{ marginTop: "1.5rem", width: "auto" }}
      >
        Edit profile
      </button>
    </main>
  );
}
