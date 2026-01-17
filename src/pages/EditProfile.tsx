import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { User } from "../models/user";
import { setTitle } from "../helpers/metadataHelper";
import { useCurrentUser } from "../context/CurrentUserContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function EditProfile() {
  const { isAuthenticated, authedFetch, clearAuthSession, setAuthSession } =
    useCurrentUser();
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

  const loginLink = `/account/login?redirect=${encodeURIComponent(
    location.pathname + location.search
  )}`;

  useEffect(() => {
    const cleanup = setTitle("Edit Profile • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setError("You need to be signed in to edit your profile.");
      return;
    }

    const loadUser = async () => {
      try {
        const response = await authedFetch(`${API_BASE}/me`, {
          requireAuth: true,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            (data && typeof data.error === "string" && data.error) ||
            "Failed to load profile.";
          setError(message);
          if (response.status === 401 || response.status === 404) {
            clearAuthSession();
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
          setAuthSession({ user: loadedUser });
        }
      } catch (err) {
        console.error("Error loading profile", err);
        setError("Something went wrong while loading your profile.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, [authedFetch, clearAuthSession, isAuthenticated, setAuthSession]);

  const normalizeUserName = (raw: string): string => {
    // Enforce URL-safe username characters: letters, numbers, '.', '_', '-'
    return raw.replace(/\s+/g, "").replace(/[^A-Za-z0-9._-]/g, "");
  };

  const userNameTrimmed = userName.trim();
  const userNameNormalized = normalizeUserName(userNameTrimmed).toLowerCase();
  const userNameLengthOk =
    userNameNormalized.length >= 3 && userNameNormalized.length <= 30;
  const userNameFormatOk = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(
    userNameNormalized
  );
  const userNameOk = userNameLengthOk && userNameFormatOk;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userNameOk) {
      setError(
        'Username must be 3-30 characters using only letters, numbers, ".", "_", or "-" (must start/end with a letter/number).'
      );
      return;
    }

    if (!isAuthenticated) {
      setError("You need to be signed in to edit your profile.");
      return;
    }

    setIsSaving(true);

    try {
      const payload: Record<string, unknown> = {
        userName: userNameNormalized,
        displayName: displayName || undefined,
        bio: bio || undefined,
        profilePictureUrl: profilePictureUrl || undefined,
        profileBackgroundUrl: profileBackgroundUrl || undefined,
      };

      const response = await authedFetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        requireAuth: true,
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
        setAuthSession({ user: updatedUser });
      }

      if (profilePictureFile || profileBackgroundFile) {
        const formData = new FormData();
        if (profilePictureFile) {
          formData.append("profilePicture", profilePictureFile);
        }
        if (profileBackgroundFile) {
          formData.append("profileBackground", profileBackgroundFile);
        }

        const imageResponse = await authedFetch(
          `${API_BASE}/users/me/profile-images`,
          {
            method: "POST",
            body: formData,
            requireAuth: true,
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
          setAuthSession({ user: updatedUser });
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
    navigate("/me/profile");
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
              onChange={(event) => {
                const next = normalizeUserName(
                  event.target.value
                ).toLowerCase();
                setUserName(next);
              }}
            />
            <div className="text-muted" style={{ fontSize: "0.85rem" }}>
              Only letters, numbers, ".", "_", "-" (3–30 chars). Saved as
              lowercase.
              {!userNameOk && userName.length > 0 ? (
                <span style={{ display: "block", color: "#fca5a5" }}>
                  Must start/end with a letter or number.
                </span>
              ) : null}
            </div>
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

          <div className="app-card" style={{ padding: "0.9rem" }}>
            <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
              Creator
            </div>
            <div className="text-muted" style={{ fontSize: "0.9rem" }}>
              Manage your creator application and creator settings on the
              Creator page.
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <Link to="/me/creator" className="auth-toggle">
                Go to Creator
              </Link>
            </div>
          </div>

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
            <button
              type="submit"
              className="auth-submit"
              disabled={isSaving || !userNameOk}
            >
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
