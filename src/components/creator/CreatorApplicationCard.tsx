import { useEffect, useRef, useState } from "react";
import DriversLicenseIcon from "../DriversLicenseIcon";
import PersonHoldingIdIcon from "../PersonHoldingIdIcon";
import { getAPIBase } from "../../helpers/api/apiHelpers";

const API_BASE = getAPIBase();

type CreatorRequest = {
  id: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  rejectionReason?: string;
};

export default function CreatorApplicationCard() {
  const [creatorRequest, setCreatorRequest] = useState<CreatorRequest | null>(
    null
  );
  const [isCreatorRequestLoading, setIsCreatorRequestLoading] = useState(false);
  const [creatorRequestError, setCreatorRequestError] = useState<string | null>(
    null
  );
  const [success, setSuccess] = useState<string | null>(null);

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

  const identityDocumentInputRef = useRef<HTMLInputElement | null>(null);
  const holdingIdentityDocumentInputRef = useRef<HTMLInputElement | null>(null);

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
    void loadCreatorRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
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
              <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                Updated {new Date(creatorRequest.createdAt).toLocaleString()}
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
      {success ? <p className="auth-success">{success}</p> : null}

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
              setSuccess(null);
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
                  <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>
                    Upload a clear photo of your government issued ID / passport
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
                      position: "relative",
                    }}
                    onClick={() => identityDocumentInputRef.current?.click()}
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
                      <div
                        style={{
                          height: "100%",
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.6rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        <DriversLicenseIcon size={44} />
                        <span style={{ fontSize: "0.9rem" }}>
                          Click to upload document
                        </span>
                      </div>
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
                  <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>
                    Upload a photo of you holding your government issued ID /
                    passport
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
                      position: "relative",
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
                      <div
                        style={{
                          height: "100%",
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.6rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        <PersonHoldingIdIcon size={44} />
                        <span style={{ fontSize: "0.9rem" }}>
                          Click to upload holding document
                        </span>
                      </div>
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
                        URL.revokeObjectURL(holdingIdentityDocumentPreview);
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
                    {isSubmittingCreatorRequest ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
