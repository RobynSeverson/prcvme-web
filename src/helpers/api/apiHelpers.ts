import type { User } from "../../models/user";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const getAPIBase = (): string => {
  return API_BASE;
};

const getWebSocketBase = (): string => {
  if (API_BASE.startsWith("https://")) {
    return API_BASE.replace(/^https:\/\//, "wss://");
  }
  if (API_BASE.startsWith("http://")) {
    return API_BASE.replace(/^http:\/\//, "ws://");
  }
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

export type DirectMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  mediaItems?: { mediaKey: string; mediaType: "image" | "video" | "audio" }[];
  createdAt: string;
};

export type MessageThread = {
  participantsKey: string;
  otherUserId: string;
  lastMessageAt: string;
  lastText: string;
};

export type PaymentMethod = {
  id: string;
  label: string;
  last4?: string;
  expMonth?: string;
  expYear?: string;
  nameOnCard?: string;
};

type PaymentMethodsResponse = {
  methods: PaymentMethod[];
  defaultId: string | null;
};

const getMyPaymentMethods = async (): Promise<PaymentMethodsResponse> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You need to be signed in to manage payment methods.");
  }

  const response = await fetch(`${API_BASE}/me/payment/methods`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to load payment methods.";
    throw new Error(message);
  }

  const methods =
    data && Array.isArray(data.methods)
      ? (data.methods as PaymentMethod[])
      : ([] as PaymentMethod[]);
  const defaultId =
    data && (typeof data.defaultId === "string" || data.defaultId === null)
      ? (data.defaultId as string | null)
      : null;

  return { methods, defaultId };
};

const addMyPaymentMethod = async (payload: {
  nameOnCard: string;
  cardNumber: string;
  expirationDate: string;
  cardCode?: string;
}): Promise<PaymentMethodsResponse> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You need to be signed in to add payment methods.");
  }

  const response = await fetch(`${API_BASE}/me/payment/methods`, {
    method: "POST",
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
      "Failed to add payment method.";
    throw new Error(message);
  }

  const methods =
    data && Array.isArray(data.methods)
      ? (data.methods as PaymentMethod[])
      : ([] as PaymentMethod[]);
  const defaultId =
    data && (typeof data.defaultId === "string" || data.defaultId === null)
      ? (data.defaultId as string | null)
      : null;

  return { methods, defaultId };
};

const removeMyPaymentMethod = async (
  paymentProfileId: string
): Promise<PaymentMethodsResponse> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You need to be signed in to remove payment methods.");
  }

  const response = await fetch(
    `${API_BASE}/me/payment/methods/${encodeURIComponent(paymentProfileId)}`,
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
      "Failed to remove payment method.";
    throw new Error(message);
  }

  const methods =
    data && Array.isArray(data.methods)
      ? (data.methods as PaymentMethod[])
      : ([] as PaymentMethod[]);
  const defaultId =
    data && (typeof data.defaultId === "string" || data.defaultId === null)
      ? (data.defaultId as string | null)
      : null;

  return { methods, defaultId };
};

const setMyDefaultPaymentMethod = async (
  paymentProfileId: string | null
): Promise<{ defaultId: string | null }> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You need to be signed in to update payment methods.");
  }

  const response = await fetch(`${API_BASE}/me/payment/default`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ paymentProfileId }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to set default payment method.";
    throw new Error(message);
  }

  const defaultId =
    data && (typeof data.defaultId === "string" || data.defaultId === null)
      ? (data.defaultId as string | null)
      : null;
  return { defaultId };
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

const getDirectMessages = async (
  userId: string,
  before?: string
): Promise<{ messages: DirectMessage[]; nextCursor: string | null }> => {
  const token = window.localStorage.getItem("authToken");

  if (!token) {
    throw new Error("You must be logged in to load messages.");
  }

  const url = new URL(
    `${API_BASE}/messages/${encodeURIComponent(userId)}`,
    window.location.origin
  );
  if (before) {
    url.searchParams.set("before", before);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to load messages.";
    throw new Error(message);
  }

  const messages =
    data && Array.isArray(data.messages)
      ? (data.messages as DirectMessage[])
      : ([] as DirectMessage[]);

  const nextCursor =
    data && (typeof data.nextCursor === "string" || data.nextCursor === null)
      ? (data.nextCursor as string | null)
      : null;

  return { messages, nextCursor };
};

const sendDirectMessage = async (
  userId: string,
  args: { text?: string; mediaFiles?: FileList | File[] | null }
): Promise<DirectMessage> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You must be logged in to send messages.");
  }

  const trimmedText = typeof args.text === "string" ? args.text.trim() : "";
  const mediaFiles = args.mediaFiles;
  const hasMedia =
    !!mediaFiles &&
    ((Array.isArray(mediaFiles) && mediaFiles.length > 0) ||
      (!Array.isArray(mediaFiles) && mediaFiles.length > 0));

  if (!trimmedText && !hasMedia) {
    throw new Error("Message must contain text, media, or both.");
  }

  const formData = new FormData();
  if (trimmedText) {
    formData.append("text", trimmedText);
  }
  if (mediaFiles) {
    const arr = Array.isArray(mediaFiles) ? mediaFiles : Array.from(mediaFiles);
    for (const file of arr) {
      formData.append("media", file);
    }
  }

  const response = await fetch(
    `${API_BASE}/messages/${encodeURIComponent(userId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to send message.";
    throw new Error(message);
  }

  if (data && data.message) {
    return data.message as DirectMessage;
  }

  throw new Error("Message data is missing.");
};

const getMyMessageThreads = async (
  before?: string,
  limit?: number
): Promise<{ threads: MessageThread[]; nextCursor: string | null }> => {
  const token = window.localStorage.getItem("authToken");

  if (!token) {
    throw new Error("You must be logged in to load message threads.");
  }

  const url = new URL(`${API_BASE}/messages`, window.location.origin);
  if (before) {
    url.searchParams.set("before", before);
  }
  if (typeof limit === "number" && Number.isFinite(limit)) {
    url.searchParams.set("limit", String(limit));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to load message threads.";
    throw new Error(message);
  }

  const threads =
    data && Array.isArray(data.threads)
      ? (data.threads as MessageThread[])
      : ([] as MessageThread[]);

  const nextCursor =
    data && (typeof data.nextCursor === "string" || data.nextCursor === null)
      ? (data.nextCursor as string | null)
      : null;

  return { threads, nextCursor };
};

const getMessagesWebSocketUrl = (userId: string): string | null => {
  const token = window.localStorage.getItem("authToken");
  if (!token) return null;

  const wsBase = getWebSocketBase();
  const url = new URL(`${wsBase}/messages/${encodeURIComponent(userId)}`);
  url.searchParams.set("token", token);
  return url.toString();
};

export {
  getAPIBase,
  getWebSocketBase,
  getUserByUserName,
  getCurrentUser,
  getMyPaymentMethods,
  addMyPaymentMethod,
  removeMyPaymentMethod,
  setMyDefaultPaymentMethod,
  getMySubscriptions,
  getMySubscriptionStatus,
  subscribeToUser,
  unsubscribeFromUser,
  getMyMessageThreads,
  getDirectMessages,
  sendDirectMessage,
  getMessagesWebSocketUrl,
};
