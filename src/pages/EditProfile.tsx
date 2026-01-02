import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { User } from "../models/user";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function EditProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [profileBackgroundUrl, setProfileBackgroundUrl] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [profileBackgroundFile, setProfileBackgroundFile] =
    useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [profileBackgroundPreview, setProfileBackgroundPreview] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const profilePictureInputRef = useRef<HTMLInputElement | null>(null);
  const profileBackgroundInputRef = useRef<HTMLInputElement | null>(null);

  const loginLink = `/login?redirect=${encodeURIComponent(
    location.pathname + location.search
  )}`;

  useEffect(() => {
    const token = window.localStorage.getItem("authToken");

    if (!token) {
      setIsLoading(false);
      setError("You need to be signed in to edit your profile.");
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
          setUserName(loadedUser.userName);
          setDisplayName(loadedUser.displayName ?? "");
          setBio(loadedUser.bio ?? "");
          setProfilePictureUrl(loadedUser.profilePictureUrl ?? "");
          setProfileBackgroundUrl(loadedUser.profileBackgroundUrl ?? "");
          setProfilePicturePreview(null);
          setProfileBackgroundPreview(null);
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const token = window.localStorage.getItem("authToken");

    if (!token) {
      setError("You need to be signed in to edit your profile.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        userName,
        displayName: displayName || undefined,
        bio: bio || undefined,
        profilePictureUrl: profilePictureUrl || undefined,
        profileBackgroundUrl: profileBackgroundUrl || undefined,
      };

      const response = await fetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to update profile.";
        setError(message);
        return;
      }

      let updatedUser: User | null = null;

      if (data && data.user) {
        updatedUser = data.user as User;
        setUser(updatedUser);
        window.localStorage.setItem("authUser", JSON.stringify(updatedUser));
      }

      if (profilePictureFile || profileBackgroundFile) {
        const formData = new FormData();
        if (profilePictureFile) {
          formData.append("profilePicture", profilePictureFile);
        }
        if (profileBackgroundFile) {
          formData.append("profileBackground", profileBackgroundFile);
        }

        const imageResponse = await fetch(
          `${API_BASE}/users/me/profile-images`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const imageData = await imageResponse.json().catch(() => null);

        if (!imageResponse.ok) {
          const message =
            (imageData &&
              typeof imageData.error === "string" &&
              imageData.error) ||
            "Failed to upload profile images.";
          setError(message);
          return;
        }

        if (imageData && imageData.user) {
          updatedUser = imageData.user as User;
          setUser(updatedUser);
          setProfilePictureUrl(updatedUser.profilePictureUrl ?? "");
          setProfileBackgroundUrl(updatedUser.profileBackgroundUrl ?? "");
          setProfilePicturePreview(null);
          setProfileBackgroundPreview(null);
          window.localStorage.setItem("authUser", JSON.stringify(updatedUser));
        }

        setProfilePictureFile(null);
        setProfileBackgroundFile(null);
      }

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Error updating profile", err);
      setError("Something went wrong while updating your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToProfile = () => {
    navigate("/profile");
  };

  if (isLoading) {
    return (
      <main>
        <h1>Edit profile</h1>
        <p>Loading your profile...</p>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main>
        <h1>Edit profile</h1>
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
        <h1>Edit profile</h1>
        <p>Profile information is not available.</p>
      </main>
    );
  }

  const buildImageUrl = (imageId?: string | null) => {
    if (!imageId) return undefined;
    if (imageId.startsWith("http://") || imageId.startsWith("https://")) {
      return imageId;
    }
    return `${API_BASE}/users/${user.id}/profile/${encodeURIComponent(
      imageId
    )}`;
  };

  const profilePictureSrc =
    profilePicturePreview ||
    buildImageUrl(profilePictureUrl || user.profilePictureUrl);
  const profileBackgroundSrc =
    profileBackgroundPreview ||
    buildImageUrl(profileBackgroundUrl || user.profileBackgroundUrl);

  return (
    <main>
      <section className="auth-card">
        <h1 className="auth-title">Edit profile</h1>
        <p className="auth-subtitle">
          Update how your profile appears to others.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Profile background</span>
            <button
              type="button"
              onClick={() => profileBackgroundInputRef.current?.click()}
              className="app-card"
              style={{
                width: "100%",
                height: "140px",
                overflow: "hidden",
                display: "block",
                padding: 0,
                cursor: "pointer",
              }}
            >
              {profileBackgroundSrc ? (
                <img
                  src={profileBackgroundSrc}
                  alt="Profile background"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "3.25rem",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  Click to upload background
                </span>
              )}
            </button>
          </label>
          <label className="auth-field">
            <span>Profile picture</span>
            <button
              type="button"
              onClick={() => profilePictureInputRef.current?.click()}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "999px",
                border: "2px solid var(--card-border)",
                background: "var(--card-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {profilePictureSrc ? (
                <img
                  src={profilePictureSrc}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "999px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                  }}
                >
                  Upload
                </span>
              )}
            </button>
            <input
              ref={profilePictureInputRef}
              type="file"
              accept="image/*"
              name="profilePictureFile"
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setProfilePictureFile(file);
                if (file) {
                  const url = URL.createObjectURL(file);
                  setProfilePicturePreview(url);
                } else {
                  setProfilePicturePreview(null);
                }
              }}
            />
          </label>
          <label className="auth-field">
            <span>Username</span>
            <input
              type="text"
              name="userName"
              required
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Display name</span>
            <input
              type="text"
              name="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Bio</span>
            <textarea
              name="bio"
              rows={4}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="new-post-textarea"
            />
          </label>

          <input
            ref={profileBackgroundInputRef}
            type="file"
            accept="image/*"
            name="profileBackgroundFile"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setProfileBackgroundFile(file);
              if (file) {
                const url = URL.createObjectURL(file);
                setProfileBackgroundPreview(url);
              } else {
                setProfileBackgroundPreview(null);
              }
            }}
          />

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button type="submit" className="auth-submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              className="auth-toggle"
              onClick={handleBackToProfile}
              style={{ marginTop: 0 }}
            >
              Back to profile
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
