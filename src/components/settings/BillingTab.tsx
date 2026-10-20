"use client";

import React from "react";
import toast from "react-hot-toast";
import {
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Building2,
  Calendar,
  DollarSign,
  Layers,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useGetMySubscriptionQuery,
  useGetPlansQuery,
  useCreateBillingPortalMutation,
  useCancelSubscriptionMutation,
} from "@/features/plan/planApi";
import { useMyProfileQuery } from "@/features/profile/profileApi";

export default function BillingTab() {
  const router = useRouter();

  const { data: profileRes, isLoading: isProfileLoading } = useMyProfileQuery(undefined);
  const { data: subRes, isLoading: isSubLoading, refetch } = useGetMySubscriptionQuery();
  const { data: plansRes, isLoading: isPlansLoading } = useGetPlansQuery();

  const [createPortal, { isLoading: isOpeningPortal }] = useCreateBillingPortalMutation();
  const [cancelSubscription, { isLoading: isCancelling }] = useCancelSubscriptionMutation();

  const user = profileRes?.data;
  const subscription = subRes?.data || user?.subscription;

  // Resolve plan ID
  const rawPlanFromSub = typeof subscription?.plan === "object" ? subscription?.plan : null;
  const planId =
    rawPlanFromSub?._id ||
    subscription?.plan ||
    user?.subscription?.plan?._id ||
    user?.subscription?.plan;

  // Match plan from backend plans list
  const plansList = plansRes?.data?.plans || [];
  const matchedPlan = plansList.find((p) => String(p._id) === String(planId)) || rawPlanFromSub;

  const isSubscribed = !!user?.subscribe || subscription?.status === "active";

  // 1. Current Plan Name
  const currentPlanName =
    matchedPlan?.title ||
    matchedPlan?.name ||
    (matchedPlan?.planType ? matchedPlan.planType.toUpperCase() : null) ||
    (isSubscribed ? "Active Workspace Plan" : "No Active Plan");

  // 2. Unit Price
  const unitPrice =
    matchedPlan?.unitPrice !== undefined && matchedPlan?.unitPrice !== null
      ? Number(matchedPlan.unitPrice)
      : matchedPlan?.planType === "pro"
      ? 2.0
      : matchedPlan?.planType === "prime"
      ? 1.0
      : matchedPlan?.price !== undefined
      ? Number(matchedPlan.price)
      : 0;

  // 3. Min Price (Monthly Minimum)
  const minimumPrice =
    matchedPlan?.minimumPrice !== undefined && matchedPlan?.minimumPrice !== null
      ? Number(matchedPlan.minimumPrice)
      : matchedPlan?.price !== undefined
      ? Number(matchedPlan.price)
      : matchedPlan?.planType === "pro"
      ? 2000
      : matchedPlan?.planType === "prime"
      ? 500
      : 0;

  // 4. Current Active Units
  const activeUnits = Number(user?.profile?.activeUnits ?? user?.totalUnitsUsed ?? 0);

  // 5. Next Billing Date
  const nextBillingDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // 6. Expected Bill Amount based on current plan
  const calculatedByUnits = activeUnits * (unitPrice || 0);
  const expectedBillAmount = isSubscribed
    ? unitPrice > 0
      ? Math.max(calculatedByUnits, minimumPrice || 0)
      : minimumPrice || subscription?.price || 0
    : 0;

  const paymentMethod = subscription?.paymentMethod;

  const handleOpenBillingPortal = async () => {
    try {
      toast.loading("Opening Stripe Customer Billing Portal...", { id: "portal-toast" });
      const res = await createPortal().unwrap();
      if (res.data?.url) {
        toast.dismiss("portal-toast");
        window.location.href = res.data.url;
      } else {
        toast.error("Portal URL not received", { id: "portal-toast" });
      }
    } catch (err: any) {
      console.error("Portal error:", err);
      const msg = err?.data?.message || err?.message || "Failed to open Stripe Billing Portal";
      toast.error(msg, { id: "portal-toast" });
    }
  };

  const handleChangePlan = () => {
    router.push("/provider-manager/verification");
  };

  const handleCancelPlan = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription auto-renewal?")) {
      return;
    }
    try {
      const res = await cancelSubscription({ cancelImmediately: false }).unwrap();
      toast.success(res.message || "Subscription updated.");
      refetch();
    } catch (err: any) {
      console.error("Cancel error:", err);
      const msg = err?.data?.message || err?.message || "Failed to cancel subscription";
      toast.error(msg);
    }
  };

  if (isProfileLoading && isSubLoading && isPlansLoading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-16 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#6B1294] animate-spin" />
        <p className="text-sm font-semibold text-gray-700">Loading billing details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Current Plan Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-5 sm:p-6 space-y-5">
        <h3 className="text-base font-bold text-gray-900 tracking-tight">
          Current Subscription Plan
        </h3>

        {/* Plan Banner */}
        <div className="bg-gradient-to-br from-[#FAF5FF] via-[#F6EEFD] to-[#FFFFFF] border border-purple-200/90 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
          
          {/* Top Row: Plan Name, Status Badge & Description */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#6B1294] text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h4 className="text-xl font-bold text-gray-900 tracking-tight">
                    {currentPlanName}
                  </h4>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isSubscribed
                        ? "bg-[#5B1B95] text-white"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {isSubscribed ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  {matchedPlan?.description ||
                    "Property management workspace, work order automation, and contractor bidding tools."}
                </p>
              </div>
            </div>

            {nextBillingDate && isSubscribed && (
              <div className="text-left sm:text-right">
                <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">
                  Renewal Date
                </span>
                <span className="text-xs font-bold text-[#5B1B95]">
                  {nextBillingDate}
                </span>
              </div>
            )}
          </div>

          {/* Key Metrics Grid: Unit Price, Min Price, Active Units, Next Billing Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Unit Price */}
            <div className="bg-white/90 border border-purple-100/90 rounded-xl p-3.5 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <DollarSign className="w-3.5 h-3.5 text-[#6B1294]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Unit Price
                </span>
              </div>
              <div className="text-base font-bold text-gray-900">
                ${unitPrice.toFixed(2)}
                <span className="text-[11px] font-normal text-gray-500 ml-1">/ active unit/mo</span>
              </div>
            </div>

            {/* 2. Monthly Minimum Price */}
            <div className="bg-white/90 border border-purple-100/90 rounded-xl p-3.5 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Layers className="w-3.5 h-3.5 text-[#6B1294]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Monthly Minimum
                </span>
              </div>
              <div className="text-base font-bold text-gray-900">
                ${minimumPrice.toLocaleString()}
                <span className="text-[11px] font-normal text-gray-500 ml-1">/ month</span>
              </div>
            </div>

            {/* 3. Current Active Units */}
            <div className="bg-white/90 border border-purple-100/90 rounded-xl p-3.5 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Building2 className="w-3.5 h-3.5 text-[#6B1294]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Active Units
                </span>
              </div>
              <div className="text-base font-bold text-gray-900">
                {activeUnits.toLocaleString()}
                <span className="text-[11px] font-normal text-gray-500 ml-1">active units</span>
              </div>
            </div>

            {/* 4. Next Billing Date */}
            <div className="bg-white/90 border border-purple-100/90 rounded-xl p-3.5 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Calendar className="w-3.5 h-3.5 text-[#6B1294]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Next Billing Date
                </span>
              </div>
              <div className="text-base font-bold text-gray-900 truncate">
                {nextBillingDate || "No upcoming bill"}
              </div>
            </div>
          </div>

          {/* Expected Bill Amount Highlight Banner */}
          <div className="bg-gradient-to-r from-purple-100/80 via-purple-50/70 to-white border border-purple-200/90 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B1B95] block">
                Expected Bill Amount
              </span>
              <p className="text-xs text-gray-600 font-normal mt-0.5">
                Calculated based on {activeUnits.toLocaleString()} active units × ${unitPrice.toFixed(2)}
                {minimumPrice > 0 ? ` (Monthly minimum: $${minimumPrice.toLocaleString()})` : ""}
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#5B1B95] tracking-tight">
                ${expectedBillAmount.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 font-semibold ml-1">/month</span>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleChangePlan}
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold px-5 py-2.5 rounded-lg text-xs sm:text-sm border border-gray-300 transition-colors cursor-pointer"
          >
            {isSubscribed ? "Change Plan" : "Select a Plan"}
          </button>

          {isSubscribed && (
            <button
              type="button"
              onClick={handleCancelPlan}
              disabled={isCancelling}
              className="bg-red-50/80 hover:bg-red-100 text-[#E53935] border border-red-300 font-semibold px-5 py-2.5 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isCancelling ? "Processing..." : "Cancel Auto-Renewal"}
            </button>
          )}
        </div>
      </div>

      {/* 2. Payment Method Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">
            Payment Method & Invoicing
          </h3>

          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secured by Stripe</span>
          </span>
        </div>

        {paymentMethod ? (
          <div className="bg-white border border-gray-300/60 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-black text-white px-2.5 py-1 text-xs font-black tracking-widest rounded-md shrink-0 uppercase">
                {paymentMethod.brand || "CARD"}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {paymentMethod.brand?.toUpperCase() || "Card"} ending in {paymentMethod.last4 || "••••"}
                </p>
                {paymentMethod.expMonth && paymentMethod.expYear && (
                  <p className="text-xs text-gray-500 font-normal mt-0.5">
                    Expires {String(paymentMethod.expMonth).padStart(2, "0")}/{paymentMethod.expYear}
                  </p>
                )}
              </div>
            </div>

            <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Default
            </span>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500 shrink-0" />
            <span>
              {isSubscribed
                ? "Your card information is stored safely in your Stripe customer account."
                : "No payment method configured yet. Select a plan to connect your billing method."}
            </span>
          </div>
        )}

        {isSubscribed && (
          <button
            type="button"
            onClick={handleOpenBillingPortal}
            disabled={isOpeningPortal}
            className="bg-[#E1D4F4] hover:bg-purple-200 text-[#5B1B95] font-semibold px-4 py-2.5 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2 border border-purple-200 w-fit disabled:opacity-50"
          >
            {isOpeningPortal ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            <span>Manage Cards & Invoices on Stripe</span>
          </button>
        )}
      </div>

      {/* 3. Maintenance Invoices Quick Link */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 tracking-tight">
            Maintenance Invoices & Contractor Payouts
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            View your work order maintenance invoices, outstanding balances, and contractor receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/invoices")}
          className="bg-[#6B1294] hover:bg-[#580e7d] text-white font-semibold px-5 py-2.5 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
        >
          View All Invoices &rarr;
        </button>
      </div>
    </div>
  );
}
