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

export type UserSubscription = {
  id: string;
  subscriberUserId: string;
  subscribedToUserId: string;
  createdAt: string;
  isActive?: boolean;
};

const getMySubscriptions = async (): Promise<UserSubscription[]> => {
  const token = window.localStorage.getItem("authToken");

  if (!token) {
    return [];
  }

  const response = await fetch(`${API_BASE}/subscriptions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to load subscriptions.";
    throw new Error(message);
  }

  if (data && Array.isArray(data.subscriptions)) {
    return data.subscriptions as UserSubscription[];
  }

  return [];
};

const subscribeToUser = async (userId: string): Promise<UserSubscription> => {
  const token = window.localStorage.getItem("authToken");

  if (!token) {
    throw new Error("You must be logged in to subscribe.");
  }

  const response = await fetch(
    `${API_BASE}/subscriptions/${encodeURIComponent(userId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to subscribe.";
    throw new Error(message);
  }

  if (data && data.subscription) {
    return data.subscription as UserSubscription;
  }

  throw new Error("Subscription data is missing.");
};

const subscriptionStatusInFlight = new Map<string, Promise<boolean>>();

const getMySubscriptionStatus = async (userId: string): Promise<boolean> => {
  const token = window.localStorage.getItem("authToken");

  if (!token) {
    return false;
  }

  const inFlightKey = `${token}|${userId}`;
  const existing = subscriptionStatusInFlight.get(inFlightKey);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const response = await fetch(
      `${API_BASE}/subscriptions/${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        (data && typeof data.error === "string" && data.error) ||
        "Failed to load subscription status.";
      throw new Error(message);
    }

    return !!(data && typeof data.subscribed === "boolean" && data.subscribed);
  })();

  subscriptionStatusInFlight.set(inFlightKey, promise);
  try {
    return await promise;
  } finally {
    subscriptionStatusInFlight.delete(inFlightKey);
  }
};

const unsubscribeFromUser = async (
  userId: string
): Promise<UserSubscription> => {
  const token = window.localStorage.getItem("authToken");

  if (!token) {
    throw new Error("You must be logged in to unsubscribe.");
  }

  const response = await fetch(
    `${API_BASE}/subscriptions/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to unsubscribe.";
    throw new Error(message);
  }

  if (data && data.subscription) {
    return data.subscription as UserSubscription;
  }

  throw new Error("Subscription data is missing.");
};

export {
  getAPIBase,
  getUserByUserName,
  getCurrentUser,
  getMySubscriptions,
  getMySubscriptionStatus,
  subscribeToUser,
  unsubscribeFromUser,
};
