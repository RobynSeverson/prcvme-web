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
  identityVerified: boolean;
  isAdmin: boolean;
};
