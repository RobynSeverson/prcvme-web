import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type User = {
  id: string;
  email: string;
  createdAt: string;
  lastUpdatedAt?: string;
  profilePictureUrl?: string;
  profileBackgroundUrl?: string;
};

export default function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = window.localStorage.getItem("authToken");

    if (!token) {
      setIsLoading(false);
      setError("You need to be signed in to view your account.");
      return;
    }

    const loadUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            (data && typeof data.error === "string" && data.error) ||
            "Failed to load account details.";
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
        console.error("Error loading account", err);
        setError("Something went wrong while loading your account.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem("authToken");
    window.localStorage.removeItem("authUser");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <main>
        <h1>Account</h1>
        <p>Loading your account...</p>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main>
        <h1>Account</h1>
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
        <h1>Account</h1>
        <p>Account information is not available.</p>
      </main>
    );
  }

  const createdAt = new Date(user.createdAt).toLocaleString();
  const lastUpdated = user.lastUpdatedAt
    ? new Date(user.lastUpdatedAt).toLocaleString()
    : null;

  return (
    <main>
      <h1>Account</h1>
      <section>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Created:</strong> {createdAt}
        </p>
        {lastUpdated && (
          <p>
            <strong>Last updated:</strong> {lastUpdated}
          </p>
        )}
      </section>

      <button type="button" onClick={handleLogout} className="auth-submit">
        Log out
      </button>
    </main>
  );
}
