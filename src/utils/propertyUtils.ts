import { baseURL } from "./BaseURL";

export const getPropertyImageUrl = (coverPhoto?: string, fallbackIndex: number = 1): string => {
  if (!coverPhoto) {
    const idx = ((fallbackIndex - 1) % 6) + 1;
    return `/images/prop_${idx}.png`;
  }
  if (
    coverPhoto.startsWith("http://") ||
    coverPhoto.startsWith("https://") ||
    coverPhoto.startsWith("blob:") ||
    coverPhoto.startsWith("data:")
  ) {
    return coverPhoto;
  }
  // Static public images stored in public/images
  if (
    coverPhoto.startsWith("/images/prop_") ||
    coverPhoto.startsWith("/images/building_") ||
    coverPhoto.startsWith("/images/house_") ||
    coverPhoto.startsWith("/images/login") ||
    coverPhoto.startsWith("/images/signup") ||
    coverPhoto.startsWith("/images/tech_")
  ) {
    return coverPhoto;
  }
  if (
    coverPhoto.startsWith("/image/") ||
    coverPhoto.startsWith("/images/") ||
    coverPhoto.startsWith("/uploads/") ||
    coverPhoto.startsWith("/documents/") ||
    coverPhoto.startsWith("/governmentId/") ||
    coverPhoto.startsWith("/proofOfInsurance/")
  ) {
    return `${baseURL}${coverPhoto}`;
  }
  return `${baseURL}/${coverPhoto.replace(/^\/+/, "")}`;
};
