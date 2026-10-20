const TOKEN_COOKIE_NAME = "projexpro_token";
const LEGACY_COOKIE_NAME = "cat-admin-token";
const LOCAL_STORAGE_KEY = "projexpro_token";
const LEGACY_STORAGE_KEY = "catAdmin";
const COOKIE_MAX_AGE = 5 * 24 * 60 * 60; // 5 days (matches backend JWT expiration)

export const saveToken = (token) => {
  if (typeof window !== "undefined" && token) {
    localStorage.setItem(LOCAL_STORAGE_KEY, token);
    localStorage.setItem(LEGACY_STORAGE_KEY, token);
    document.cookie = `${TOKEN_COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    document.cookie = `${LEGACY_COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }
};

export const getToken = () => {
  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (localToken) return localToken;
    const match =
      document.cookie.match(new RegExp(`(^| )${TOKEN_COOKIE_NAME}=([^;]+)`)) ||
      document.cookie.match(new RegExp(`(^| )${LEGACY_COOKIE_NAME}=([^;]+)`));
    if (match) return match[2];
  }
  return null;
};

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem("adminLoginId");
    document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    document.cookie = `${LEGACY_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
};

