"use client";

import React, { useState } from "react";
import { Check, Crown, ArrowRight, Sparkles, Building2, Shield, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useGetPlansQuery, useCreateEnterpriseRequestMutation } from "@/features/plan/planApi";
import { IBackendPlan } from "@/types/plan";

export interface SelectedPlanInfo {
  id: string;
  name: string;
  planType: "prime" | "pro" | "enterprise";
  pricePerUnit: number;
  monthlyMinimum: number;
  activeUnits: number;
  estimatedTotal: number;
  price?: number;
}

interface Step7ChoosePlanProps {
  onSelectPlan: (plan: SelectedPlanInfo) => void;
  portfolioSizeText?: string;
  activeUnits?: number;
  onRefresh?: () => void;
}

interface PlanDisplayItem {
  id: string;
  title: string;
  planType: "prime" | "pro" | "enterprise";
  tagline: string;
  pricePerUnit: number;
  unitRange: string;
  minimumText: string;
  monthlyMinimum: number;
  isPopular: boolean;
  badgeText?: string;
  benefits: string[];
}

const defaultBenefitsByPlan: Record<string, string[]> = {
  prime: [
    "Work Order & Ticket Management",
    "Tenant & Vendor Communication",
    "Basic Invoice & Payment Processing",
    "Automated Monthly Financial Reporting",
    "Email Customer Support",
  ],
  pro: [
    "All Prime features, plus",
    "Renovation & Turnover Workspace",
    "Multi-Vendor Bidding & Comparison",
    "Milestone-Based Project Approvals",
    "Vendor Performance & Compliance Tracking",
    "Priority Access to Vetted Marketplace",
    "Priority 24/7 Account Support",
  ],
  enterprise: [
    "All Pro features, plus",
    "Unlimited Property Units & Portfolios",
    "Instant Emergency Job Matching",
    "API Integration & Webhooks",
    "Dedicated Account Manager (24/7)",
    "Custom SLA Guarantee (99.9%)",
  ],
};

export default function Step7ChoosePlan({
  onSelectPlan,
  portfolioSizeText,
  activeUnits: propActiveUnits,
  onRefresh,
}: Step7ChoosePlanProps) {
  const { data: plansRes, isLoading: isPlansLoading } = useGetPlansQuery();
  const [createEnterpriseRequest, { isLoading: isSubmittingEnterprise }] =
    useCreateEnterpriseRequestMutation();

  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("plan-pro");

  // Fallback plans if backend plans are loading or empty
  const fallbackPlans: PlanDisplayItem[] = [
    {
      id: "6ab0ab86da68611ab0818482",
      title: "PRIME",
      planType: "prime",
      tagline: "For property managers starting out with core operational tools",
      pricePerUnit: 1.0,
      unitRange: "Up to 1,000 Units",
      minimumText: "$500 monthly min.",
      monthlyMinimum: 500,
      isPopular: false,
      benefits: defaultBenefitsByPlan.prime,
    },
    {
      id: "6ab0ac02da68611ab0818484",
      title: "ProjexPro Pro",
      planType: "pro",
      tagline: "For property professionals ready to streamline operations",
      pricePerUnit: 2.0,
      unitRange: "1,000 – 15,000 Units",
      minimumText: "$2,000 monthly min. | 1,000-door min.",
      monthlyMinimum: 2000,
      isPopular: true,
      badgeText: "MOST POPULAR",
      benefits: defaultBenefitsByPlan.pro,
    },
    {
      id: "6ad6f27bb440ba0aa3aefb28",
      title: "ENTERPRISE",
      planType: "enterprise",
      tagline: "For enterprise portfolio leaders needing custom scale & SLA support",
      pricePerUnit: 3.5,
      unitRange: "15,000+ Units",
      minimumText: "Custom monthly min. | Enterprise SLA",
      monthlyMinimum: 3500,
      isPopular: false,
      benefits: defaultBenefitsByPlan.enterprise,
    },
  ];

  // Merge plans from backend if available
  const backendPlans: IBackendPlan[] = plansRes?.data?.plans || [];
  const displayPlans: PlanDisplayItem[] =
    backendPlans.length > 0
      ? backendPlans.map((bp) => {
          const planType =
            bp.planType ||
            (bp.title.toLowerCase().includes("enterprise")
              ? "enterprise"
              : bp.title.toLowerCase().includes("pro")
              ? "pro"
              : "prime");

          const isPro = planType === "pro";
          const isEnt = planType === "enterprise";

          const unitPrice = bp.unitPrice || (isEnt ? 3.5 : isPro ? 2.0 : 1.0);
          const minPrice = bp.minimumPrice || (isEnt ? 3500 : isPro ? 2000 : 500);

          return {
            id: bp._id,
            title: bp.title,
            planType,
            tagline:
              bp.description ||
              (isEnt
                ? "For enterprise portfolio leaders needing custom scale & SLA support"
                : isPro
                ? "For property professionals ready to streamline operations"
                : "For property managers starting out with core operational tools"),
            pricePerUnit: unitPrice,
            unitRange: isEnt ? "15,000+ Units" : isPro ? "1,000 – 15,000 Units" : "Up to 1,000 Units",
            minimumText: isEnt
              ? "Custom monthly min. | Enterprise SLA"
              : isPro
              ? "$2,000 monthly min. | 1,000-door min."
              : "$500 monthly min.",
            monthlyMinimum: minPrice,
            isPopular: isPro,
            badgeText: isPro ? "MOST POPULAR" : isEnt ? "CUSTOM SLA" : undefined,
            benefits: bp.features && bp.features.length ? bp.features : defaultBenefitsByPlan[planType],
          };
        })
      : fallbackPlans;

  // Active selected plan
  const currentSelected =
    displayPlans.find((p) => p.id === selectedPlanId) ||
    displayPlans.find((p) => p.planType === "pro") ||
    displayPlans[0];

  const isEnterprise = currentSelected?.planType === "enterprise";

  const handleProceed = () => {
    if (isEnterprise) {
      handleEnterpriseSubmit();
      return;
    }

    const resolveUnits = () => {
      if (propActiveUnits && propActiveUnits > 0) return propActiveUnits;
      if (portfolioSizeText) {
        if (portfolioSizeText.includes("1-50")) return 50;
        if (portfolioSizeText.includes("51-200")) return 200;
        if (portfolioSizeText.includes("201-500")) return 500;
        if (portfolioSizeText.includes("501+")) return 1000;
        const parsed = parseInt(portfolioSizeText.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      return 1250;
    };

    const activeUnits = resolveUnits();
    const calcSub = activeUnits * currentSelected.pricePerUnit;
    const estimatedTotal = Math.max(calcSub, currentSelected.monthlyMinimum);

    onSelectPlan({
      id: currentSelected.id,
      name: currentSelected.title,
      planType: currentSelected.planType,
      pricePerUnit: currentSelected.pricePerUnit,
      monthlyMinimum: currentSelected.monthlyMinimum,
      activeUnits,
      estimatedTotal,
    });
  };

  const handleEnterpriseSubmit = async () => {
    try {
      const res = await createEnterpriseRequest({ planId: currentSelected.id }).unwrap();
      toast.success(res?.message || "Enterprise plan request submitted successfully!");
      setEnterpriseSubmitted(true);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error("Enterprise request error:", error);
      const errMsg =
        error?.data?.message ||
        error?.message ||
        "Failed to submit enterprise request. Please try again.";
      toast.error(errMsg);
    }
  };

  // If Enterprise request was submitted, show confirmation state
  if (enterpriseSubmitted) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-8 px-4 text-center animate-in fade-in duration-300">
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping" />
          <div className="w-20 h-20 rounded-full bg-purple-100 border-2 border-[#5B1B95] text-[#5B1B95] flex items-center justify-center shadow-lg relative z-10">
            <Building2 className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-purple-100 text-[#6B1294] rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enterprise Request Submitted</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-medium text-[#2E0054] tracking-tight">
            Custom Enterprise Review Underway
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-normal max-w-lg mx-auto leading-relaxed">
            Thank you! Your request for the <strong className="text-gray-900">ProjexPro Enterprise Plan</strong> has been received by our platform administrator.
          </p>
        </div>

        <div className="bg-purple-50/70 border border-purple-200/60 rounded-2xl p-5 text-left max-w-lg mx-auto space-y-2 text-xs text-purple-950 leading-relaxed shadow-sm">
          <h4 className="font-bold text-[#6B1294] text-xs uppercase tracking-wide flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#6B1294]" />
            <span>What happens next?</span>
          </h4>
          <p className="text-gray-700">
            Our enterprise onboarding team is tailoring your custom SLA contract, volume unit rates, and dedicated account manager. Once the administrator approves your enterprise request, your workspace will be instantly activated.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="w-full sm:w-auto px-6 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
              <span>Check Activation Status</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setEnterpriseSubmitted(false)}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#6B1294] hover:bg-[#580e7d] text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-md"
          >
            <span>Change Plan Selection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 bg-purple-100 text-[#6B1294] font-bold text-xs rounded-full inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#6B1294]" />
          <span>Step 2 of Verification Activation</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-medium text-[#4C127D] tracking-tight">
          Select Your Workspace Plan
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 font-normal">
          Choose the plan that fits your portfolio. Prime and Pro plans activate via Stripe, while Enterprise plans offer custom SLA contracts.
        </p>
      </div>

      {isPlansLoading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6B1294]"></div>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 w-full">
        {displayPlans.map((p) => {
          const isSelected = selectedPlanId === p.id || (!selectedPlanId && p.planType === "pro");
          const isPlanEnterprise = p.planType === "enterprise";

          return (
            <div
              key={p.id}
              onClick={() => setSelectedPlanId(p.id)}
              className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all cursor-pointer relative ${
                isSelected
                  ? isPlanEnterprise
                    ? "border-2 border-amber-500 bg-amber-50/30 shadow-md ring-2 ring-amber-300/30"
                    : "border-2 border-[#6B1294] bg-purple-50/40 shadow-md ring-2 ring-purple-300/30"
                  : "border border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm"
              }`}
            >
              {p.badgeText && (
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                    isPlanEnterprise ? "bg-amber-600" : "bg-[#6B1294]"
                  }`}
                >
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span>{p.badgeText}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? isPlanEnterprise
                          ? "border-amber-600 bg-amber-600 text-white"
                          : "border-[#6B1294] bg-[#6B1294] text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-gray-500 font-normal leading-relaxed">{p.tagline}</p>

                {/* Price */}
                <div className="border-t border-b border-gray-100 py-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-medium text-gray-900">
                      ${p.pricePerUnit.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">/ unit / month</span>
                  </div>
                  <p className="text-[11px] text-[#6B1294] font-semibold mt-0.5">{p.minimumText}</p>
                </div>

                {/* Benefits */}
                <div className="space-y-2 text-xs">
                  {p.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-gray-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Select Button */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(p.id);
                    if (!isPlanEnterprise) {
                      handleProceed();
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    isSelected
                      ? isPlanEnterprise
                        ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md"
                        : "bg-[#6B1294] hover:bg-[#580e7d] text-white shadow-md"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                  }`}
                >
                  {isSelected ? "Plan Selected ✓" : "Select Plan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Row */}
      <div className="flex items-center justify-end pt-4">
        {isEnterprise ? (
          <button
            type="button"
            onClick={handleEnterpriseSubmit}
            disabled={isSubmittingEnterprise}
            className="py-3.5 px-8 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-md flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            <span>
              {isSubmittingEnterprise ? "Submitting Enterprise Request..." : "Submit Enterprise Request"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleProceed}
            className="py-3.5 px-8 bg-[#6B1294] hover:bg-[#580e7d] text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-md flex items-center gap-2"
          >
            <span>Proceed to Billing & Activation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

