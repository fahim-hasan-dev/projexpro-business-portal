"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken, removeToken } from "@/utils/storage";

interface ProtectedRouteProps {
  children: ReactNode;
}

function parseJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    const isAuthRoute = pathname.startsWith("/auth");
    const isPublicRoute = isAuthRoute || pathname === "/unauthorized";

    const hasToken = Boolean(token);
    const payload = token ? parseJwt(token) : null;

    if (!hasToken && !isPublicRoute) {
      router.replace("/auth/login");
      setIsAuthorized(false);
    } else if (hasToken && isAuthRoute) {
      const isServiceProvider = payload?.role === "service_provider";
      router.replace(isServiceProvider ? "/services_provider/overview" : "/");
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);


  const isAuthRoute = pathname.startsWith("/auth");
  const isPublicRoute = isAuthRoute || pathname === "/unauthorized";

  if (isAuthorized === false && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}

