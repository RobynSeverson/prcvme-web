import { getAPIBase } from "../helpers/api/apiHelpers";

const API_BASE = getAPIBase();

const buildProfileImageUrl = (userId: string, imageId?: string | null) => {
  if (!imageId) return undefined;
  if (imageId.startsWith("http://") || imageId.startsWith("https://")) {
    return imageId;
  }
  return `${API_BASE}/users/${userId}/profile/${imageId}`;
};

const buildMediaUrl = (userId: string, mediaId: string) => {
  return `${API_BASE}/users/${userId}/media/${mediaId}`;
};

export { buildProfileImageUrl, buildMediaUrl };
