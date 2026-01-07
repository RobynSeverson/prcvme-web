export type MediaType = "image" | "video" | "audio";

export type UserPostMediaItem = {
  mediaKey: string;
  mediaType: MediaType;
};

export type UserPost = {
  id: string;
  userId: string;
  text?: string;
  expiresAt?: string | null;
  mediaItems: UserPostMediaItem[];
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
};
