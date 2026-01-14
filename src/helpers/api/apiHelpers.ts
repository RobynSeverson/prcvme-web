import type { User } from "../../models/user";
import type {
  FavoriteKind,
  FavoriteTargetType,
  EnrichedFavorite,
} from "../../models/favorite";
import type { MediaType } from "../../models/userPost";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const PROFILE_API_BASE = import.meta.env.VITE_PROFILE_API_URL ?? API_BASE;

const getAPIBase = (): string => {
  return API_BASE;
};

const getProfileAPIBase = (): string => {
  return PROFILE_API_BASE;
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
  accessUntil?: string;
};

export type CreatorSubscriber = {
  id: string;
  subscriberUserId: string;
  createdAt: string;
  isActive?: boolean;
  accessUntil?: string;
  user: User | null;
};

export type DirectMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  mediaItems?: { mediaKey: string; mediaType: "image" | "video" | "audio" }[];
  price?: number;
  isUnlocked?: boolean;
  deleted?: boolean;
  createdAt: string;
};

export type MessageThread = {
  participantsKey: string;
  otherUserId: string;
  lastMessageAt: string;
  lastText: string;
  isUnread?: boolean;
};

export type ProfitSummaryResponse = {
  currency: string;
  total: number;
  day: number;
  week: number;
  month: number;
  activeSubscriptions: number;
  subscriptionPrice?: number;
  subscriptions?: {
    total: number;
    day: number;
    week: number;
    month: number;
  };
  dm?: {
    total: number;
    day: number;
    week: number;
    month: number;
    salesCount: number;
  };
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

const getMySubscribers = async (args?: {
  includeInactive?: boolean;
}): Promise<CreatorSubscriber[]> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You must be logged in to view subscribers.");
  }

  const params = new URLSearchParams();
  if (args?.includeInactive) {
    params.set("includeInactive", "1");
  }

  const url = params.toString()
    ? `${API_BASE}/me/subscribers?${params.toString()}`
    : `${API_BASE}/me/subscribers`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to load subscribers.";
    throw new Error(message);
  }

  if (data && Array.isArray(data.subscribers)) {
    return data.subscribers as CreatorSubscriber[];
  }

  return [];
};

const subscribeToUser = async (
  userId: string,
  args?: {
    paymentProfileId?: string;
    cardInfo?: {
      nameOnCard: string;
      cardNumber: string;
      expirationDate: string;
      cardCode?: string;
    };
  }
): Promise<UserSubscription> => {
  const token = window.localStorage.getItem("authToken");

  if (!token) {
    throw new Error("You must be logged in to subscribe.");
  }

  const response = await fetch(
    `${API_BASE}/subscriptions/${encodeURIComponent(userId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentProfileId: args?.paymentProfileId,
        cardInfo: args?.cardInfo,
      }),
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

export type MySubscriptionStatus = {
  subscribed: boolean;
  subscription?: {
    id?: string;
    isActive?: boolean;
    accessUntil?: string;
  };
};

const getMySubscription = async (
  userId: string
): Promise<MySubscriptionStatus> => {
  const token = window.localStorage.getItem("authToken");

  if (!token) {
    return { subscribed: false };
  }

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

  const subscribed = !!(
    data &&
    typeof data.subscribed === "boolean" &&
    data.subscribed
  );
  const subscription =
    data && data.subscription && typeof data.subscription === "object"
      ? (data.subscription as {
          id?: string;
          isActive?: boolean;
          accessUntil?: string;
        })
      : undefined;

  return { subscribed, subscription };
};

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
    const result = await getMySubscription(userId);
    return !!result.subscribed;
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

const deleteMyPost = async (postId: string): Promise<void> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You must be logged in to delete posts.");
  }

  const response = await fetch(
    `${API_BASE}/users/me/post/${encodeURIComponent(postId)}`,
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
      "Failed to delete post.";
    throw new Error(message);
  }
};

const getMyProfit = async (): Promise<ProfitSummaryResponse> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You must be logged in to view profit.");
  }

  const response = await fetch(`${API_BASE}/me/profit`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to load profit.";
    throw new Error(message);
  }

  if (data && data.summary) {
    return data.summary as ProfitSummaryResponse;
  }

  throw new Error("Profit data is missing.");
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
  args: {
    text?: string;
    mediaFiles?: FileList | File[] | null;
    price?: number | null;
  }
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
  if (
    typeof args.price === "number" &&
    Number.isFinite(args.price) &&
    args.price > 0
  ) {
    formData.append("price", String(args.price));
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

const purchaseDirectMessageMedia = async (args: {
  messageId: string;
  paymentProfileId?: string;
  cardInfo?: {
    nameOnCard: string;
    cardNumber: string;
    expirationDate: string;
    cardCode?: string;
  };
}): Promise<{ ok: true; messageId: string; isUnlocked: true }> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You must be logged in to purchase media.");
  }

  if (!args.messageId) {
    throw new Error("Missing messageId.");
  }

  const response = await fetch(
    `${API_BASE}/messages/direct/${encodeURIComponent(
      args.messageId
    )}/purchase`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentProfileId: args.paymentProfileId,
        cardInfo: args.cardInfo,
      }),
    }
  );

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to purchase media.";
    throw new Error(message);
  }

  if (data && data.ok === true && typeof data.messageId === "string") {
    return { ok: true, messageId: data.messageId, isUnlocked: true };
  }

  throw new Error("Purchase response is missing.");
};

const deleteDirectMessage = async (
  messageId: string
): Promise<{ ok: true; messageId: string; deleted: true }> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You must be logged in to delete messages.");
  }

  if (!messageId) {
    throw new Error("Missing messageId.");
  }

  const response = await fetch(
    `${API_BASE}/messages/direct/${encodeURIComponent(messageId)}`,
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
      "Failed to delete message.";
    throw new Error(message);
  }

  if (data && data.ok === true && typeof data.messageId === "string") {
    return { ok: true, messageId: data.messageId, deleted: true };
  }

  throw new Error("Delete response is missing.");
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

const getUnreadMessageThreadCount = async (): Promise<number> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) return 0;

  const response = await fetch(`${API_BASE}/messages/unread-count`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return 0;
  }

  return data && typeof data.unreadThreads === "number"
    ? data.unreadThreads
    : 0;
};

const markMessageThreadRead = async (userId: string): Promise<void> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) return;

  await fetch(`${API_BASE}/messages/${encodeURIComponent(userId)}/read`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => null);
};

const getMessagesWebSocketUrl = (userId: string): string | null => {
  const token = window.localStorage.getItem("authToken");
  if (!token) return null;

  const wsBase = getWebSocketBase();
  const url = new URL(`${wsBase}/messages/${encodeURIComponent(userId)}`);
  url.searchParams.set("token", token);
  return url.toString();
};

// ==================== Password Reset ====================

const requestPasswordReset = async (email: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to request password reset.";
    throw new Error(message);
  }
};

const verifyPasswordResetToken = async (token: string): Promise<boolean> => {
  const url = new URL(
    `${API_BASE}/auth/reset-password/verify`,
    window.location.origin
  );
  url.searchParams.set("token", token);

  const response = await fetch(url.toString());
  const data = await response.json().catch(() => null);
  return !!(response.ok && data && data.valid === true);
};

const resetPassword = async (args: {
  token: string;
  newPassword: string;
}): Promise<void> => {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to reset password.";
    throw new Error(message);
  }
};

// ==================== Favorites (Likes & Bookmarks) ====================

export type CreateFavoriteArgs = {
  kind: FavoriteKind;
  targetType: FavoriteTargetType;
  targetId: string;
  mediaKey?: string;
  mediaType?: MediaType;
};

/**
 * Create a favorite (like or bookmark) for a target.
 */
const createFavorite = async (args: CreateFavoriteArgs): Promise<void> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You must be logged in to like or bookmark.");
  }

  const response = await fetch(`${API_BASE}/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(args),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to create favorite.";
    throw new Error(message);
  }
};

export type DeleteFavoriteArgs = {
  kind: FavoriteKind;
  targetType: FavoriteTargetType;
  targetId: string;
  mediaKey?: string;
};

/**
 * Delete a favorite (unlike or unbookmark).
 */
const deleteFavorite = async (args: DeleteFavoriteArgs): Promise<void> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You must be logged in to unlike or unbookmark.");
  }

  const response = await fetch(`${API_BASE}/favorites`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(args),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to delete favorite.";
    throw new Error(message);
  }
};

export type GetFavoriteStatusArgs = {
  kind: FavoriteKind;
  targetType: FavoriteTargetType;
  targetId: string;
  mediaKey?: string;
};

/**
 * Check if the current user has favorited a specific target.
 */
const getFavoriteStatus = async (
  args: GetFavoriteStatusArgs
): Promise<boolean> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    return false;
  }

  const params = new URLSearchParams({
    kind: args.kind,
    targetType: args.targetType,
    targetId: args.targetId,
  });
  if (args.mediaKey) {
    params.set("mediaKey", args.mediaKey);
  }

  const response = await fetch(`${API_BASE}/favorites/status?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return false;
  }

  return !!(data && data.favorited);
};

export type GetBulkFavoriteStatusArgs = {
  kind: FavoriteKind;
  targets: Array<{
    targetType: FavoriteTargetType;
    targetId: string;
    mediaKey?: string;
  }>;
};

/**
 * Check favorite status for multiple targets at once.
 * Returns a map of "targetType:targetId" or "targetType:targetId:mediaKey" to boolean.
 */
const getBulkFavoriteStatus = async (
  args: GetBulkFavoriteStatusArgs
): Promise<Record<string, boolean>> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    return {};
  }

  const response = await fetch(`${API_BASE}/favorites/status/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(args),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return {};
  }

  return (data && data.status) || {};
};

export type GetFavoriteCountArgs = {
  kind: FavoriteKind;
  targetType: FavoriteTargetType;
  targetId: string;
  mediaKey?: string;
};

/**
 * Get the count of favorites (likes or bookmarks) for a target.
 */
const getFavoriteCount = async (
  args: GetFavoriteCountArgs
): Promise<number> => {
  const params = new URLSearchParams({
    kind: args.kind,
    targetType: args.targetType,
    targetId: args.targetId,
  });
  if (args.mediaKey) {
    params.set("mediaKey", args.mediaKey);
  }

  const response = await fetch(`${API_BASE}/favorites/count?${params}`);

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return 0;
  }

  return typeof data?.count === "number" ? data.count : 0;
};

export type GetMyFavoritesArgs = {
  kind: FavoriteKind;
  targetType: FavoriteTargetType;
  limit?: number;
  cursor?: string;
};

export type GetMyFavoritesResponse = {
  favorites: EnrichedFavorite[];
  nextCursor: string | null;
};

/**
 * Get the current user's favorites for the Collections page.
 */
const getMyFavorites = async (
  args: GetMyFavoritesArgs
): Promise<GetMyFavoritesResponse> => {
  const token = window.localStorage.getItem("authToken");
  if (!token) {
    throw new Error("You must be logged in to view your collections.");
  }

  const params = new URLSearchParams({
    kind: args.kind,
    targetType: args.targetType,
  });
  if (args.limit) {
    params.set("limit", String(args.limit));
  }
  if (args.cursor) {
    params.set("cursor", args.cursor);
  }

  const response = await fetch(`${API_BASE}/me/favorites?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Failed to load favorites.";
    throw new Error(message);
  }

  return {
    favorites: (data && Array.isArray(data.favorites)
      ? data.favorites
      : []) as EnrichedFavorite[],
    nextCursor:
      data && (typeof data.nextCursor === "string" || data.nextCursor === null)
        ? (data.nextCursor as string | null)
        : null,
  };
};

export {
  getAPIBase,
  getProfileAPIBase,
  getWebSocketBase,
  getUserByUserName,
  getCurrentUser,
  getMyPaymentMethods,
  addMyPaymentMethod,
  removeMyPaymentMethod,
  setMyDefaultPaymentMethod,
  getMySubscriptions,
  getMySubscribers,
  getMySubscription,
  getMySubscriptionStatus,
  subscribeToUser,
  unsubscribeFromUser,
  deleteMyPost,
  getMyProfit,
  getMyMessageThreads,
  getUnreadMessageThreadCount,
  getDirectMessages,
  sendDirectMessage,
  purchaseDirectMessageMedia,
  deleteDirectMessage,
  markMessageThreadRead,
  getMessagesWebSocketUrl,
  // Password reset
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPassword,
  // Favorites
  createFavorite,
  deleteFavorite,
  getFavoriteStatus,
  getBulkFavoriteStatus,
  getFavoriteCount,
  getMyFavorites,
};
