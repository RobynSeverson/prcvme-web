import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { SubscriptionDeal, User } from "../models/user";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function EditProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [subscriptionPrice, setSubscriptionPrice] = useState<string>("");
  const [subscriptionDeals, setSubscriptionDeals] = useState<
    Array<{
      dealId: string;
      months: string;
      price: string;
      title: string;
      description: string;
      expiresAt: string;
    }>
  >([]);
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
  const [creatorRequest, setCreatorRequest] = useState<null | {
    id: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    rejectionReason?: string;
  }>(null);
  const [isCreatorRequestLoading, setIsCreatorRequestLoading] = useState(false);
  const [creatorRequestError, setCreatorRequestError] = useState<string | null>(
    null
  );
  const [showCreatorRequestForm, setShowCreatorRequestForm] = useState(false);
  const [identityDocumentFile, setIdentityDocumentFile] = useState<File | null>(
    null
  );
  const [holdingIdentityDocumentFile, setHoldingIdentityDocumentFile] =
    useState<File | null>(null);
  const [identityDocumentPreview, setIdentityDocumentPreview] = useState<
    string | null
  >(null);
  const [holdingIdentityDocumentPreview, setHoldingIdentityDocumentPreview] =
    useState<string | null>(null);
  const [isSubmittingCreatorRequest, setIsSubmittingCreatorRequest] =
    useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const profilePictureInputRef = useRef<HTMLInputElement | null>(null);
  const profileBackgroundInputRef = useRef<HTMLInputElement | null>(null);
  const identityDocumentInputRef = useRef<HTMLInputElement | null>(null);
  const holdingIdentityDocumentInputRef = useRef<HTMLInputElement | null>(null);

  const loginLink = `/login?redirect=${encodeURIComponent(
    location.pathname + location.search
  )}`;

  const createDealId = (): string => {
    try {
      if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return (crypto as any).randomUUID();
      }
    } catch {
      // ignore
    }
    return `${Date.now().toString(16)}-${Math.random()
      .toString(16)
      .slice(2)}-${Math.random().toString(16).slice(2)}`;
  };

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

          const loadedPrice =
            typeof loadedUser.subscriptionPrice === "number"
              ? String(loadedUser.subscriptionPrice)
              : "";
          setSubscriptionPrice(loadedPrice);

          const loadedDeals: SubscriptionDeal[] = Array.isArray(
            loadedUser.subscriptionDeals
          )
            ? loadedUser.subscriptionDeals
            : [];

          const toDateInputValue = (value: unknown): string => {
            if (typeof value !== "string" || !value.trim()) return "";
            // If it's already YYYY-MM-DD, keep it.
            if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return "";
            return d.toISOString().slice(0, 10);
          };

          const defaultTitle = (months: number) =>
            `${months} month${months === 1 ? "" : "s"} deal`;
          const defaultDescription = (months: number) =>
            `Pay for ${months} month${months === 1 ? "" : "s"} up front.`;

          setSubscriptionDeals(
            loadedDeals.map((d) => ({
              dealId:
                typeof (d as any).dealId === "string" &&
                (d as any).dealId.trim()
                  ? (d as any).dealId
                  : createDealId(),
              months: String(d.months),
              price: String(d.price),
              title:
                typeof (d as any).title === "string" && (d as any).title.trim()
                  ? (d as any).title
                  : defaultTitle(d.months),
              description:
                typeof (d as any).description === "string" &&
                (d as any).description.trim()
                  ? (d as any).description
                  : defaultDescription(d.months),
              expiresAt: toDateInputValue((d as any).expiresAt),
            }))
          );

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

  const loadCreatorRequest = async () => {
    const token = window.localStorage.getItem("authToken");
    if (!token) return;

    setCreatorRequestError(null);
    setIsCreatorRequestLoading(true);
    try {
      const response = await fetch(`${API_BASE}/creator-request/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to load creator request.";
        setCreatorRequestError(message);
        return;
      }

      const req = data && data.request ? (data.request as any) : null;
      if (!req) {
        setCreatorRequest(null);
        return;
      }

      if (
        req &&
        (req.status === "pending" ||
          req.status === "approved" ||
          req.status === "rejected") &&
        typeof req.createdAt === "string"
      ) {
        setCreatorRequest({
          id: String(req.id),
          status: req.status,
          createdAt: req.createdAt,
          rejectionReason:
            typeof req.rejectionReason === "string"
              ? req.rejectionReason
              : undefined,
        });
      } else {
        setCreatorRequest(null);
      }
    } catch (err) {
      console.error("Error loading creator request", err);
      setCreatorRequestError(
        "Something went wrong while loading creator request."
      );
    } finally {
      setIsCreatorRequestLoading(false);
    }
  };

  useEffect(() => {
    // For non-creators, show status of creator request.
    if (!user) return;
    if (user.isCreator) return;
    void loadCreatorRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.isCreator]);

  useEffect(() => {
    return () => {
      if (identityDocumentPreview) URL.revokeObjectURL(identityDocumentPreview);
      if (holdingIdentityDocumentPreview)
        URL.revokeObjectURL(holdingIdentityDocumentPreview);
    };
  }, [identityDocumentPreview, holdingIdentityDocumentPreview]);

  const submitCreatorRequest = async () => {
    setCreatorRequestError(null);
    setSuccess(null);

    const token = window.localStorage.getItem("authToken");
    if (!token) {
      setCreatorRequestError("You need to be signed in.");
      return;
    }

    if (!identityDocumentFile || !holdingIdentityDocumentFile) {
      setCreatorRequestError(
        "Please select both a document image and a holding-document image."
      );
      return;
    }

    setIsSubmittingCreatorRequest(true);
    try {
      const formData = new FormData();
      formData.append("document", identityDocumentFile);
      formData.append("holdingDocument", holdingIdentityDocumentFile);

      const response = await fetch(`${API_BASE}/creator-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to submit creator request.";
        setCreatorRequestError(message);
        return;
      }

      setSuccess("Creator request submitted.");
      setShowCreatorRequestForm(false);

      setIdentityDocumentFile(null);
      setHoldingIdentityDocumentFile(null);
      if (identityDocumentPreview) URL.revokeObjectURL(identityDocumentPreview);
      if (holdingIdentityDocumentPreview)
        URL.revokeObjectURL(holdingIdentityDocumentPreview);
      setIdentityDocumentPreview(null);
      setHoldingIdentityDocumentPreview(null);

      await loadCreatorRequest();
    } catch (err) {
      console.error("Error submitting creator request", err);
      setCreatorRequestError(
        "Something went wrong while submitting your request."
      );
    } finally {
      setIsSubmittingCreatorRequest(false);
    }
  };

  const normalizeCurrencyInput = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const withLeadingZero = trimmed.startsWith(".") ? `0${trimmed}` : trimmed;
    return withLeadingZero.endsWith(".")
      ? withLeadingZero.slice(0, -1)
      : withLeadingZero;
  };

  const normalizeUserName = (raw: string): string => {
    // Enforce URL-safe username characters: letters, numbers, '.', '_', '-'
    return raw.replace(/\s+/g, "").replace(/[^A-Za-z0-9._-]/g, "");
  };

  const userNameTrimmed = userName.trim();
  const userNameNormalized = normalizeUserName(userNameTrimmed);
  const userNameLengthOk =
    userNameNormalized.length >= 3 && userNameNormalized.length <= 30;
  const userNameFormatOk = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(
    userNameNormalized
  );
  const userNameOk = userNameLengthOk && userNameFormatOk;

  const isValidCurrency = (value: string): boolean => {
    const normalized = normalizeCurrencyInput(value);
    if (!normalized) return false;
    // Currency with max 2 decimal places.
    return /^\d+(\.\d{1,2})?$/.test(normalized);
  };

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

    const token = window.localStorage.getItem("authToken");

    if (!token) {
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

      if (user?.isCreator) {
        const trimmedPrice = subscriptionPrice.trim();
        if (trimmedPrice) {
          if (!isValidCurrency(trimmedPrice)) {
            setError("Subscription price must have at most 2 decimal places.");
            return;
          }
          const normalizedPrice = normalizeCurrencyInput(trimmedPrice);
          const parsed = Number(normalizedPrice);
          if (!Number.isFinite(parsed) || parsed < 0) {
            setError("Subscription price must be a number >= 0.");
            return;
          }
          if (parsed > 100) {
            setError("Subscription price must be <= 100.00.");
            return;
          }
          payload.subscriptionPrice = parsed;
        } else {
          payload.subscriptionPrice = null;
        }

        const deals: SubscriptionDeal[] = [];
        for (const deal of subscriptionDeals) {
          const dealId = deal.dealId;
          const monthsRaw = deal.months.trim();
          const priceRaw = deal.price.trim();
          const titleRaw = deal.title.trim();
          const descriptionRaw = deal.description.trim();
          const expiresAtRaw = deal.expiresAt.trim();

          const isBlank =
            !monthsRaw &&
            !priceRaw &&
            !titleRaw &&
            !descriptionRaw &&
            !expiresAtRaw;
          if (isBlank) continue;

          if (!monthsRaw || !priceRaw || !titleRaw || !descriptionRaw) {
            setError(
              "Each deal must include months, price, title, and description (or leave the row blank)."
            );
            return;
          }

          if (!dealId || typeof dealId !== "string" || !dealId.trim()) {
            setError(
              "Each deal must have an id. Try removing and re-adding the deal row."
            );
            return;
          }

          const months = Number.parseInt(monthsRaw, 10);
          if (!isValidCurrency(priceRaw)) {
            setError("Deal price must have at most 2 decimal places.");
            return;
          }
          const normalizedDealPrice = normalizeCurrencyInput(priceRaw);
          const price = Number(normalizedDealPrice);

          if (!Number.isFinite(months) || months <= 0) {
            setError("Deal months must be an integer > 0.");
            return;
          }
          if (!Number.isFinite(price) || price < 0) {
            setError("Deal price must be a number >= 0.");
            return;
          }
          if (price > 100) {
            setError("Deal price must be <= 100.00.");
            return;
          }

          if (titleRaw.length > 80) {
            setError("Deal title must be 80 characters or less.");
            return;
          }

          if (descriptionRaw.length > 280) {
            setError("Deal description must be 280 characters or less.");
            return;
          }

          if (expiresAtRaw && !/^\d{4}-\d{2}-\d{2}$/.test(expiresAtRaw)) {
            setError("Deal expiration must be a valid date.");
            return;
          }

          deals.push({
            dealId: dealId.trim(),
            months,
            price,
            title: titleRaw,
            description: descriptionRaw,
            ...(expiresAtRaw ? { expiresAt: expiresAtRaw } : {}),
          });
        }

        payload.subscriptionDeals = deals;
      }

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

  const handleAddDealRow = () => {
    setSubscriptionDeals((prev) => [
      ...prev,
      {
        dealId: createDealId(),
        months: "",
        price: "",
        title: "",
        description: "",
        expiresAt: "",
      },
    ]);
  };

  const handleRemoveDealRow = (index: number) => {
    setSubscriptionDeals((prev) => prev.filter((_, i) => i !== index));
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
              onChange={(event) => {
                const next = normalizeUserName(event.target.value);
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

          {!user.isCreator ? (
            <section className="auth-card" style={{ marginBottom: "1rem" }}>
              <h2 style={{ marginTop: 0 }}>Creator application</h2>
              <p className="text-muted" style={{ marginTop: 0 }}>
                Submit identity images to request creator access.
              </p>

              {creatorRequest ? (
                <div className="app-card" style={{ padding: "0.9rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        Status: {creatorRequest.status}
                      </div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.9rem" }}
                      >
                        Updated{" "}
                        {new Date(creatorRequest.createdAt).toLocaleString()}
                      </div>
                      {creatorRequest.status === "rejected" &&
                      creatorRequest.rejectionReason ? (
                        <p className="auth-error" style={{ marginBottom: 0 }}>
                          {creatorRequest.rejectionReason}
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      className="auth-toggle"
                      style={{ marginTop: 0, width: "auto" }}
                      onClick={() => {
                        setCreatorRequestError(null);
                        void loadCreatorRequest();
                      }}
                      disabled={isCreatorRequestLoading}
                    >
                      {isCreatorRequestLoading ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-muted" style={{ marginTop: 0 }}>
                  You haven’t submitted a creator request yet.
                </p>
              )}

              {creatorRequestError ? (
                <p className="auth-error">{creatorRequestError}</p>
              ) : null}

              {creatorRequest?.status === "pending" ? (
                <p className="text-muted" style={{ marginBottom: 0 }}>
                  Your request is pending review.
                </p>
              ) : (
                <div>
                  <button
                    type="button"
                    className="auth-submit"
                    style={{ width: "auto" }}
                    onClick={() => {
                      setCreatorRequestError(null);
                      setShowCreatorRequestForm((prev) => !prev);
                    }}
                  >
                    {showCreatorRequestForm
                      ? "Hide form"
                      : creatorRequest?.status === "rejected"
                      ? "Resubmit creator request"
                      : "Apply to become a creator"}
                  </button>

                  {showCreatorRequestForm ? (
                    <div
                      className="app-card"
                      style={{ padding: "1rem", marginTop: "0.75rem" }}
                    >
                      <div style={{ display: "grid", gap: "0.75rem" }}>
                        <div>
                          <div
                            style={{ fontWeight: 600, marginBottom: "0.35rem" }}
                          >
                            Identity document
                          </div>
                          <button
                            type="button"
                            className="app-card"
                            style={{
                              width: "100%",
                              padding: 0,
                              height: "180px",
                              overflow: "hidden",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              identityDocumentInputRef.current?.click()
                            }
                          >
                            {identityDocumentPreview ? (
                              <img
                                src={identityDocumentPreview}
                                alt="Identity document preview"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  display: "inline-block",
                                  marginTop: "4.5rem",
                                  color: "var(--text-muted)",
                                  fontSize: "0.85rem",
                                }}
                              >
                                Click to upload document
                              </span>
                            )}
                          </button>
                          <input
                            ref={identityDocumentInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              setIdentityDocumentFile(file);
                              if (identityDocumentPreview) {
                                URL.revokeObjectURL(identityDocumentPreview);
                              }
                              setIdentityDocumentPreview(
                                file ? URL.createObjectURL(file) : null
                              );
                            }}
                          />
                        </div>

                        <div>
                          <div
                            style={{ fontWeight: 600, marginBottom: "0.35rem" }}
                          >
                            Holding document
                          </div>
                          <button
                            type="button"
                            className="app-card"
                            style={{
                              width: "100%",
                              padding: 0,
                              height: "180px",
                              overflow: "hidden",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              holdingIdentityDocumentInputRef.current?.click()
                            }
                          >
                            {holdingIdentityDocumentPreview ? (
                              <img
                                src={holdingIdentityDocumentPreview}
                                alt="Holding document preview"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  display: "inline-block",
                                  marginTop: "4.5rem",
                                  color: "var(--text-muted)",
                                  fontSize: "0.85rem",
                                }}
                              >
                                Click to upload holding document
                              </span>
                            )}
                          </button>
                          <input
                            ref={holdingIdentityDocumentInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              setHoldingIdentityDocumentFile(file);
                              if (holdingIdentityDocumentPreview) {
                                URL.revokeObjectURL(
                                  holdingIdentityDocumentPreview
                                );
                              }
                              setHoldingIdentityDocumentPreview(
                                file ? URL.createObjectURL(file) : null
                              );
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "0.75rem",
                          }}
                        >
                          <button
                            type="button"
                            className="auth-toggle"
                            style={{ marginTop: 0, width: "auto" }}
                            onClick={() => setShowCreatorRequestForm(false)}
                            disabled={isSubmittingCreatorRequest}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="auth-submit"
                            style={{ marginTop: 0, width: "auto" }}
                            onClick={() => {
                              void submitCreatorRequest();
                            }}
                            disabled={isSubmittingCreatorRequest}
                          >
                            {isSubmittingCreatorRequest
                              ? "Submitting..."
                              : "Submit"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}

          {user.isCreator && (
            <div className="app-card" style={{ padding: "1rem" }}>
              <h2 style={{ marginTop: 0 }}>Subscription pricing</h2>
              <label className="auth-field">
                <span>Monthly price (USD)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={subscriptionPrice}
                  onChange={(event) => setSubscriptionPrice(event.target.value)}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <h3 style={{ margin: 0 }}>Deals</h3>
                <button
                  type="button"
                  className="auth-toggle"
                  style={{ marginTop: 0 }}
                  onClick={handleAddDealRow}
                >
                  Add deal
                </button>
              </div>

              {subscriptionDeals.length === 0 ? (
                <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>
                  No deals yet. Add one if you want discounted multi-month
                  pricing.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "0.75rem",
                    marginTop: "0.75rem",
                  }}
                >
                  {subscriptionDeals.map((deal, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                        alignItems: "end",
                        padding: "0.75rem",
                        border: "1px solid var(--border-color)",
                        borderRadius: "0.75rem",
                      }}
                    >
                      <label className="auth-field" style={{ margin: 0 }}>
                        <span>Months</span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={deal.months}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSubscriptionDeals((prev) =>
                              prev.map((d, i) =>
                                i === index ? { ...d, months: value } : d
                              )
                            );
                          }}
                        />
                      </label>
                      <label className="auth-field" style={{ margin: 0 }}>
                        <span>Price (USD)</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={deal.price}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSubscriptionDeals((prev) =>
                              prev.map((d, i) =>
                                i === index ? { ...d, price: value } : d
                              )
                            );
                          }}
                        />
                      </label>

                      <label
                        className="auth-field"
                        style={{ margin: 0, gridColumn: "1 / -1" }}
                      >
                        <span>Title</span>
                        <input
                          type="text"
                          value={deal.title}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSubscriptionDeals((prev) =>
                              prev.map((d, i) =>
                                i === index ? { ...d, title: value } : d
                              )
                            );
                          }}
                        />
                      </label>

                      <label
                        className="auth-field"
                        style={{ margin: 0, gridColumn: "1 / -1" }}
                      >
                        <span>Description</span>
                        <textarea
                          rows={2}
                          value={deal.description}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSubscriptionDeals((prev) =>
                              prev.map((d, i) =>
                                i === index ? { ...d, description: value } : d
                              )
                            );
                          }}
                          className="new-post-textarea"
                        />
                      </label>

                      <label className="auth-field" style={{ margin: 0 }}>
                        <span>Expires (optional)</span>
                        <input
                          type="date"
                          value={deal.expiresAt}
                          onChange={(event) => {
                            const value = event.target.value;
                            setSubscriptionDeals((prev) =>
                              prev.map((d, i) =>
                                i === index ? { ...d, expiresAt: value } : d
                              )
                            );
                          }}
                        />
                      </label>

                      <div
                        style={{ display: "flex", justifyContent: "flex-end" }}
                      >
                        <button
                          type="button"
                          className="auth-toggle"
                          style={{ marginTop: 0 }}
                          onClick={() => handleRemoveDealRow(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
