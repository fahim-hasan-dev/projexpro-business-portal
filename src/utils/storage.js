const TOKEN_COOKIE_NAME = "projexpro_token";
const LEGACY_COOKIE_NAME = "cat-admin-token";
const LOCAL_STORAGE_KEY = "projexpro_token";
const LEGACY_STORAGE_KEY = "catAdmin";

// Token expiration is strictly controlled by backend JWT.
// No client-side max-age or expiration is set.
export const saveToken = (token) => {
  if (typeof window !== "undefined" && token) {
    localStorage.setItem(LOCAL_STORAGE_KEY, token);
    localStorage.setItem(LEGACY_STORAGE_KEY, token);
    document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
    document.cookie = `${LEGACY_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
  }
};

export const getToken = () => {
  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (localToken) return localToken;
    const match =
      document.cookie.match(new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE_NAME}=([^;]+)`)) ||
      document.cookie.match(new RegExp(`(?:^|;\\s*)${LEGACY_COOKIE_NAME}=([^;]+)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
};

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem("adminLoginId");

    // Force expiration with both expires in the past and max-age=0
    document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
    document.cookie = `${LEGACY_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;

    try {
      fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } catch {
      // no-op
    }
  }
};
