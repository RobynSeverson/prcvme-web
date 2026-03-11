import { useCallback, useEffect, useRef, useState } from "react";
import { getAPIBase } from "../../helpers/api/apiHelpers";
import { useCurrentUser } from "../../context/CurrentUserContext";

const API_BASE = getAPIBase();

type ConsentDoc = {
  id: string;
  depictedPersonLabel: string;
  originalFileName: string;
  mimeType: string;
  uploadedAt: string;
};

export default function CreatorConsentDocumentsCard() {
  const { isAuthenticated, authedFetch } = useCurrentUser();

  const [docs, setDocs] = useState<ConsentDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [depictedPersonLabel, setDepictedPersonLabel] = useState("");
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDocs = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await authedFetch(`${API_BASE}/consent-documents`, {
        requireAuth: true,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Failed to load consent documents.",
        );
        return;
      }
      setDocs(Array.isArray(data?.documents) ? (data.documents as ConsentDoc[]) : []);
    } catch {
      setError("Something went wrong loading consent documents.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authedFetch]);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  const handleUpload = async () => {
    setError(null);
    setSuccess(null);

    if (!depictedPersonLabel.trim()) {
      setError("Please enter the name or identifier of the depicted person.");
      return;
    }

    if (!consentFile) {
      setError("Please select a consent form file to upload.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("consentForm", consentFile);
      formData.append("depictedPersonLabel", depictedPersonLabel.trim());

      const response = await authedFetch(`${API_BASE}/consent-documents`, {
        method: "POST",
        body: formData,
        requireAuth: true,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Failed to upload consent document.",
        );
        return;
      }

      setSuccess("Consent document uploaded successfully.");
      setShowUploadForm(false);
      setDepictedPersonLabel("");
      setConsentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocs();
    } catch {
      setError("Something went wrong uploading the consent document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    setError(null);
    setSuccess(null);
    setDeletingId(docId);
    try {
      const response = await authedFetch(
        `${API_BASE}/consent-documents/${docId}`,
        { method: "DELETE", requireAuth: true },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Failed to delete consent document.",
        );
        return;
      }
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      setSuccess("Consent document deleted.");
    } catch {
      setError("Something went wrong deleting the consent document.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="auth-card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Consent Documents</h2>
      <p className="text-muted" style={{ marginTop: 0 }}>
        Per the{" "}
        <a
          href="/company/user-creator-contract"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#6366f1" }}
        >
          Creator Agreement
        </a>
        , you must obtain and maintain written consent from every person
        depicted in your content, and verify their identity and age (18+).
        Upload copies of those consent forms here.
      </p>

      {error ? <p className="auth-error">{error}</p> : null}
      {success ? <p className="auth-success">{success}</p> : null}

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : docs.length > 0 ? (
        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.75rem" }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="app-card"
              style={{
                padding: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: "0.1rem" }}>
                  {doc.depictedPersonLabel}
                </div>
                <div
                  className="text-muted"
                  style={{
                    fontSize: "0.85rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.originalFileName} &middot;{" "}
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                type="button"
                className="auth-toggle"
                style={{ marginTop: 0, width: "auto", flexShrink: 0 }}
                onClick={() => void handleDelete(doc.id)}
                disabled={deletingId === doc.id}
              >
                {deletingId === doc.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted" style={{ marginBottom: "0.75rem" }}>
          No consent documents uploaded yet.
        </p>
      )}

      <button
        type="button"
        className="auth-submit"
        style={{ width: "auto" }}
        onClick={() => {
          setError(null);
          setSuccess(null);
          setShowUploadForm((prev) => !prev);
        }}
      >
        {showUploadForm ? "Hide form" : "Upload consent document"}
      </button>

      {showUploadForm ? (
        <div
          className="app-card"
          style={{ padding: "1rem", marginTop: "0.75rem", display: "grid", gap: "0.75rem" }}
        >
          <div>
            <label
              htmlFor="depicted-person-label"
              style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}
            >
              Depicted person name or identifier
            </label>
            <input
              id="depicted-person-label"
              type="text"
              className="auth-input"
              placeholder="e.g. Jane Doe"
              value={depictedPersonLabel}
              onChange={(e) => setDepictedPersonLabel(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label
              htmlFor="consent-form-file"
              style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}
            >
              Consent form file (PDF, image, or document)
            </label>
            <input
              id="consent-form-file"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
              onChange={(e) => setConsentFile(e.target.files?.[0] ?? null)}
            />
            {consentFile ? (
              <div className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                Selected: {consentFile.name}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button
              type="button"
              className="auth-toggle"
              style={{ marginTop: 0, width: "auto" }}
              onClick={() => setShowUploadForm(false)}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="auth-submit"
              style={{ marginTop: 0, width: "auto" }}
              onClick={() => void handleUpload()}
              disabled={isUploading}
            >
              {isUploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
