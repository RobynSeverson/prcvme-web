import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CreatorApplicationCard from "../components/creator/CreatorApplicationCard";
import CreatorPayoutSettingsCard from "../components/creator/CreatorPayoutSettingsCard";
import CreatorSubscriptionSettingsCard from "../components/creator/CreatorSubscriptionSettingsCard";
import { setTitle } from "../helpers/metadataHelper";
import { useCurrentUser } from "../context/CurrentUserContext";

export default function Creator() {
  const {
    user: currentUser,
    isAuthenticated,
    refreshCurrentUser,
    setCurrentUser,
  } = useCurrentUser();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginLink = useMemo(() => {
    return `/account/login?redirect=${encodeURIComponent("/me/creator")}`;
  }, []);

  useEffect(() => {
    const cleanup = setTitle("Creator • prcvme");
    return () => {
      cleanup();
    };
  }, []);

  const refreshMe = async () => {
    if (!isAuthenticated) return;

    try {
      setError(null);
      setIsLoading(true);

      await refreshCurrentUser({ force: true });
    } catch (err) {
      const message =
        (err instanceof Error && err.message) ||
        "Failed to refresh your account.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <main>
        <p>You need to log in to access creator settings.</p>
        <p>
          <Link to={loginLink}>Go to login</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <section className="auth-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <h1 className="auth-title" style={{ marginBottom: "0.25rem" }}>
              {currentUser?.isCreator ? "Creator Settings" : "Become a Creator"}
            </h1>
            <p className="auth-subtitle" style={{ marginTop: 0 }}>
              {currentUser?.isCreator
                ? "Manage subscription pricing and creator settings."
                : "Apply to become a creator and start earning."}
            </p>
          </div>
          <button
            type="button"
            className="auth-toggle"
            style={{ marginTop: 0, whiteSpace: "nowrap" }}
            onClick={() => void refreshMe()}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <div style={{ marginTop: "1rem" }}>
          {currentUser?.isCreator ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              <CreatorSubscriptionSettingsCard
                user={currentUser}
                onUserUpdated={(u) => setCurrentUser(u)}
              />
              <CreatorPayoutSettingsCard
                user={currentUser}
                onUserUpdated={(u) => setCurrentUser(u)}
              />
            </div>
          ) : (
            <CreatorApplicationCard />
          )}
        </div>
      </section>
    </main>
  );
}
