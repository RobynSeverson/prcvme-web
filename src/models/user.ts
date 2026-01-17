export type SubscriptionDeal = {
  dealId: string;
  months: number;
  price: number;
  title: string;
  description: string;
  expiresAt?: string;
};

export type WelcomeMessageMediaItem = {
  mediaKey: string;
  mediaType: "image" | "video" | "audio";
};

export type User = {
  id: string;
  email: string;
  userName: string;
  displayName?: string;
  bio?: string;
  createdAt: string;
  lastUpdatedAt?: string;
  profilePictureUrl?: string;
  profileBackgroundUrl?: string;
  profilePreviewUrl?: string;
  isActive: boolean;
  isCreator: boolean;
  subscriptionPrice?: number;
  subscriptionDeals?: SubscriptionDeal[];
  welcomeMessageEnabled?: boolean;
  welcomeMessageText?: string;
  welcomeMessagePrice?: number;
  welcomeMessageMediaItems?: WelcomeMessageMediaItem[];
  payoutMethod?: "cashapp" | "venmo" | "zelle";
  payoutHandle?: string;
  payoutZelleContact?: string;
  identityVerified: boolean;
  isAdmin: boolean;
};
