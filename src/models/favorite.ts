import type { User } from "./user";
import type { UserPost, MediaType } from "./userPost";

/**
 * The type of item being favorited (liked or bookmarked).
 * - dmMedia: A specific media item within a direct message
 */
export type FavoriteTargetType = "profile" | "post" | "media" | "dmMedia";

/**
 * The kind of favorite action.
 */
export type FavoriteKind = "like" | "bookmark";

/**
 * A favorite record from the API.
 */
export type Favorite = {
  id: string;
  targetId: string;
  targetType: FavoriteTargetType;
  mediaKey?: string;
  mediaType?: MediaType;
  createdAt: string;
};

/**
 * Enriched favorite with target data for display.
 */
export type FavoriteWithProfile = Favorite & {
  target: Pick<
    User,
    "id" | "userName" | "displayName" | "profilePictureUrl" | "bio"
  > | null;
};

export type FavoriteWithPost = Favorite & {
  target: UserPost | null;
};

export type FavoriteWithMedia = Favorite & {
  target: UserPost | null;
};

export type FavoriteWithDmMedia = Favorite & {
  target: {
    id: string;
    fromUserId: string;
    toUserId: string;
    text: string;
    mediaItems?: { mediaKey: string; mediaType: MediaType }[];
    createdAt: string;
  } | null;
};

export type EnrichedFavorite =
  | FavoriteWithProfile
  | FavoriteWithPost
  | FavoriteWithMedia
  | FavoriteWithDmMedia;
