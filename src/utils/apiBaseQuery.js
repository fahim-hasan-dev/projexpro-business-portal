import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import toast from 'react-hot-toast';
import { baseURL } from './BaseURL';
import { getToken, removeToken } from './storage';
import { logout } from '../features/auth/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${baseURL}/api/v1`,
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});


// If backend returns 401 Unauthorized or Token Expired error
const isTokenExpiredOrUnauthorized = (result) => {
  const status = result?.error?.status ?? result?.error?.originalStatus;
  const dataStatusCode = result?.error?.data?.statusCode ?? result?.data?.statusCode;
  const message = (result?.error?.data?.message || result?.data?.message || '').toLowerCase();

  return (
    status === 401 ||
    dataStatusCode === 401 ||
    message.includes('access token has expired') ||
    message.includes('jwt expired') ||
    message.includes('token expired')
  );
};

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (isTokenExpiredOrUnauthorized(result)) {
    removeToken();
    api.dispatch(logout());
    api.dispatch(baseApi.util.resetApiState());

    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/auth")) {
        const message = result?.error?.data?.message || "Session expired. Please log in again.";
        toast.error(message, { id: "auth-session-expired" });
        window.location.href = `/auth/login?from=${encodeURIComponent(currentPath)}`;
      }
    }
  }

  return result;
};


export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: ["Auth", "Profile", "Plan", "Subscription", "Property", "Category", "ServiceRequest", "Invoice", "Payment"],
});

