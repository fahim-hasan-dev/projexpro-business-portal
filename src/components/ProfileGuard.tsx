"use client";

import { useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useMyProfileQuery } from "../features/profile/profileApi";
import { getRedirectUrlForProfile, isUserAllowedInDashboard } from "../utils/authRedirect";

interface ProfileGuardProps {
  children: ReactNode;
}

/**
 * ProfileGuard protects all dashboard routes under (main).
 * It strictly blocks users who are unapproved or (for Property Managers) unsubscribed.
 * If not allowed, users are immediately redirected to the appropriate verification page.
 */
export default function ProfileGuard({ children }: ProfileGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, isError } = useMyProfileQuery(undefined);

  const profileData = data?.data || data;
  const userRole = profileData?.role;
  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isServiceProvider = userRole === "service_provider" || userRole === "provider";
  const isAllowed = profileData ? isUserAllowedInDashboard(profileData) : false;

  useEffect(() => {
    if (isLoading) return;

    if (isError) {
      router.replace("/auth/login");
      return;
    }

    if (!profileData) return;

    // Block unapproved or incomplete or unsubscribed users from dashboard
    if (!isAllowed) {
      const redirectUrl = getRedirectUrlForProfile(profileData);
      router.replace(redirectUrl);
      return;
    }

    // Role-based routing boundary within dashboard
    if (!isAdmin) {
      if (isServiceProvider && !pathname.startsWith("/services_provider")) {
        router.replace("/services_provider/overview");
      } else if (!isServiceProvider && pathname.startsWith("/services_provider")) {
        router.replace("/");
      }
    }
  }, [isLoading, isError, profileData, isAllowed, isAdmin, isServiceProvider, pathname, router]);

  // Show loading spinner while profile is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6B1294]"></div>
      </div>
    );
  }

  // Prevent flash of dashboard content if unauthenticated or error
  if (isError || !profileData) {
    return null;
  }

  // If user is not allowed into dashboard, render nothing while redirecting
  if (!isAllowed) {
    return null;
  }

  // Prevent flash if user is on the wrong dashboard for their role
  if (!isAdmin) {
    if (isServiceProvider && !pathname.startsWith("/services_provider")) {
      return null;
    }
    if (!isServiceProvider && pathname.startsWith("/services_provider")) {
      return null;
    }
  }

  return <>{children}</>;
}


