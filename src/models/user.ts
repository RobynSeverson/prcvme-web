export type SubscriptionDeal = {
  dealId: string;
  months: number;
  price: number;
  title: string;
  description: string;
  expiresAt?: string;
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
  isActive: boolean;
  isCreator: boolean;
  subscriptionPrice?: number;
  subscriptionDeals?: SubscriptionDeal[];
  identityVerified: boolean;
  isAdmin: boolean;
};
