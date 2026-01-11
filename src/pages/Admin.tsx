import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { isUserLoggedIn } from "../helpers/auth/authHelpers";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type AdminUserRow = {
  id: string;
  userName: string;
  displayName?: string;
  email: string;
  isCreator: boolean;
  isAdmin: boolean;
  isActive: boolean;
};

export default function Admin() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const loginLink = useMemo(
    () =>
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`,
    [location.pathname, location.search]
  );

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("authToken")
      : null;

  const isAdmin = useMemo(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem("authUser")
          : null;
      const parsed = raw ? (JSON.parse(raw) as { isAdmin?: boolean }) : null;
      return Boolean(parsed && parsed.isAdmin === true);
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isUserLoggedIn()) {
      setError("You need to be signed in to view admin tools.");
      return;
    }
    if (!isAdmin) {
      setError("Admin access required.");
      return;
    }
  }, [isAdmin]);

  const search = async () => {
    setError(null);

    if (!token) {
      setError("You need to be signed in to view admin tools.");
      return;
    }

    if (!isAdmin) {
      setError("Admin access required.");
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const url = new URL(`${API_BASE}/admin/users`);
      url.searchParams.set("query", trimmed);
      url.searchParams.set("limit", "20");

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to search users.";
        setError(message);
        return;
      }

      const users =
        data && Array.isArray(data.users) ? (data.users as AdminUserRow[]) : [];
      setResults(users);
    } catch (err) {
      console.error("Error searching users", err);
      setError("Something went wrong while searching users.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCreator = async (user: AdminUserRow) => {
    if (!token) return;

    const updateKey = `${user.id}:creator`;
    setIsUpdating((prev) => ({ ...prev, [updateKey]: true }));
    try {
      const response = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isCreator: !user.isCreator }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to update user.";
        setError(message);
        return;
      }

      const updated = data && data.user ? (data.user as AdminUserRow) : null;
      if (!updated) {
        setError("Failed to update user.");
        return;
      }

      setResults((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (err) {
      console.error("Error updating user", err);
      setError("Something went wrong while updating the user.");
    } finally {
      setIsUpdating((prev) => ({ ...prev, [updateKey]: false }));
    }
  };

  const toggleActive = async (user: AdminUserRow) => {
    if (!token) return;

    const updateKey = `${user.id}:active`;
    setIsUpdating((prev) => ({ ...prev, [updateKey]: true }));
    try {
      const response = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) ||
          "Failed to update user.";
        setError(message);
        return;
      }

      const updated = data && data.user ? (data.user as AdminUserRow) : null;
      if (!updated) {
        setError("Failed to update user.");
        return;
      }

      setResults((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (err) {
      console.error("Error updating user", err);
      setError("Something went wrong while updating the user.");
    } finally {
      setIsUpdating((prev) => ({ ...prev, [updateKey]: false }));
    }
  };

  if (!isUserLoggedIn()) {
    return (
      <main>
        <h1>Admin</h1>
        <p className="auth-error">You need to be signed in.</p>
        <p>
          <Link to={loginLink}>Go to login</Link>
        </p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main>
        <h1>Admin</h1>
        <p className="auth-error">Admin access required.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Admin</h1>

      <section className="app-card" style={{ padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>User search</h2>
        <p className="text-muted" style={{ marginTop: 0 }}>
          Search by username, display name, or email.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
          className="auth-form message-form"
        >
          <input
            type="text"
            className="auth-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            aria-label="Search users"
          />
          <button type="submit" className="auth-submit">
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {error ? <p className="auth-error">{error}</p> : null}

        {results.length > 0 ? (
          <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
            {results.map((u) => (
              <div key={u.id} className="app-card admin-user-row">
                <div className="admin-user-info">
                  <div className="admin-user-title">
                    {u.displayName || u.userName}{" "}
                    <span className="text-muted">@{u.userName}</span>
                  </div>
                  <div className="text-muted admin-user-meta">
                    {u.email}
                    {u.isAdmin ? " • admin" : ""}
                    {!u.isActive ? " • inactive" : ""}
                  </div>
                </div>

                <div className="admin-user-actions admin-user-actions-desktop">
                  <span className="text-muted admin-user-status">
                    {u.isCreator ? "Creator" : "Viewer"} •{" "}
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    type="button"
                    className="auth-toggle"
                    disabled={Boolean(isUpdating[`${u.id}:creator`])}
                    onClick={() => {
                      setError(null);
                      void toggleCreator(u);
                    }}
                    style={{ marginTop: 0 }}
                  >
                    {isUpdating[`${u.id}:creator`]
                      ? "Updating..."
                      : u.isCreator
                      ? "Remove creator"
                      : "Make creator"}
                  </button>

                  <button
                    type="button"
                    className="auth-toggle"
                    disabled={Boolean(isUpdating[`${u.id}:active`])}
                    onClick={() => {
                      setError(null);
                      void toggleActive(u);
                    }}
                    style={{ marginTop: 0 }}
                  >
                    {isUpdating[`${u.id}:active`]
                      ? "Updating..."
                      : u.isActive
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </div>

                <details className="admin-user-actions admin-user-actions-mobile">
                  <summary>Options</summary>
                  <div className="admin-user-actions-body">
                    <span className="text-muted admin-user-status">
                      {u.isCreator ? "Creator" : "Viewer"} •{" "}
                      {u.isActive ? "Active" : "Inactive"}
                    </span>

                    <button
                      type="button"
                      className="auth-toggle admin-toggle-button"
                      disabled={Boolean(isUpdating[`${u.id}:creator`])}
                      onClick={() => {
                        setError(null);
                        void toggleCreator(u);
                      }}
                      style={{ marginTop: 0 }}
                    >
                      {isUpdating[`${u.id}:creator`]
                        ? "Updating..."
                        : u.isCreator
                        ? "Remove creator"
                        : "Make creator"}
                    </button>

                    <button
                      type="button"
                      className="auth-toggle admin-toggle-button"
                      disabled={Boolean(isUpdating[`${u.id}:active`])}
                      onClick={() => {
                        setError(null);
                        void toggleActive(u);
                      }}
                      style={{ marginTop: 0 }}
                    >
                      {isUpdating[`${u.id}:active`]
                        ? "Updating..."
                        : u.isActive
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>
                </details>
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && query.trim() && results.length === 0 ? (
          <p className="text-muted" style={{ marginTop: "1rem" }}>
            No users found.
          </p>
        ) : null}
      </section>
    </main>
  );
}
