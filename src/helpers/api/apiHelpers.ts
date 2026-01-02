import type { User } from "../../models/user";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const getAPIBase = (): string => {
  return API_BASE;
};

const getUserByUserName = async (userName: string) => {
  try {
    const response = await fetch(
      `${API_BASE}/users/${encodeURIComponent(userName)}`
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const message =
        (data && typeof data.error === "string" && data.error) ||
        "Failed to load user.";
      throw new Error(message);
    }

    if (data && data.user) {
      return data.user as User;
    }

    throw new Error("User data is missing.");
  } catch (err) {
    throw err;
  }
};

const getCurrentUser = async (): Promise<User | null> => {
  const token = window.localStorage.getItem("authToken");

  if (!token) {
    return null;
  }

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
        "Failed to load current user.";
      throw new Error(message);
    }

    if (data && data.user) {
      window.localStorage.setItem("authUser", JSON.stringify(data.user));
      return data.user as User;
    }

    return null;
  } catch (err) {
    throw err;
  }
};

export { getAPIBase, getUserByUserName, getCurrentUser };
