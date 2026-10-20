/**
 * Checks whether a user has fulfilled all requirements to enter the dashboard.
 * - Admin / Super Admin: Always allowed.
 * - Service Provider: Requires admin approval. No subscription required.
 * - Property Manager: Requires admin approval AND active subscription.
 */
export const isUserAllowedInDashboard = (profile: any): boolean => {
  if (!profile) return false;
  const role = profile?.role;
  const isAdmin = role === "admin" || role === "super_admin";
  if (isAdmin) return true;

  const isServiceProvider = role === "service_provider" || role === "provider";
  const isPropertyManager = role === "property_manager" || role === "manager";

  const approvalStatus =
    profile?.approvalStatus || profile?.profile?.approvalStatus || "pending";
  const isApproved = approvalStatus === "approved";
  const isSubscribed = Boolean(profile?.subscribe || profile?.subscription?.status === "active");

  if (!isApproved) return false;

  if (isServiceProvider) {
    return true;
  }

  if (isPropertyManager) {
    return isSubscribed;
  }

  return isSubscribed;
};

/**
 * Determines the appropriate redirect URL based on:
 * - User role (property_manager vs service_provider vs admin)
 * - Admin approval status ('pending' | 'resubmitted' | 'rejected' | 'approved')
 * - Subscription status (required for Property Manager, NOT required for Service Provider)
 */
export const getRedirectUrlForProfile = (profile: any): string => {
  const role = profile?.role;
  const isAdmin = role === "admin" || role === "super_admin";
  if (isAdmin) {
    return "/";
  }

  const isServiceProvider = role === "service_provider" || role === "provider";
  const isPropertyManager = role === "property_manager" || role === "manager";

  const approvalStatus =
    profile?.approvalStatus || profile?.profile?.approvalStatus || "pending";
  const isApproved = approvalStatus === "approved";
  const isSubscribed = Boolean(profile?.subscribe || profile?.subscription?.status === "active");

  // Service Provider: needs admin approval. NO subscription needed.
  if (isServiceProvider) {
    if (!isApproved) {
      return "/service-provider/verification";
    }
    return "/services_provider/overview";
  }

  // Property Manager: needs admin approval AND active subscription.
  if (isPropertyManager) {
    if (!isApproved || !isSubscribed) {
      return "/provider-manager/verification";
    }
    return "/";
  }

  return isApproved && isSubscribed ? "/" : "/provider-manager/verification";
};
