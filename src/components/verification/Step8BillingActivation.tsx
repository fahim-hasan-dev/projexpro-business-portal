"use client";

import React, { useState, useEffect } from "react";
import {
  Crown,
  Building2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Lock,
  Info,
  Check,
  ChevronsUpDown,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCreateCheckoutSessionMutation } from "@/features/plan/planApi";
import { useMyProfileQuery } from "@/features/profile/profileApi";
import { SelectedPlanInfo } from "./Step7ChoosePlan";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const countries = [
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Japan", label: "Japan" },
  { value: "Singapore", label: "Singapore" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "India", label: "India" },
];

interface Step8BillingActivationProps {
  selectedPlan: SelectedPlanInfo;
  onPaymentSuccess?: () => void;
  onBack?: () => void;
  contactName?: string;
  contactEmail?: string;
  billingAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export default function Step8BillingActivation({
  selectedPlan,
  onBack,
  contactName = "",
  contactEmail = "",
  billingAddress: propAddress = "",
  city: propCity = "",
  state: propState = "",
  zipCode: propZip = "",
  country: propCountry = "United States",
}: Step8BillingActivationProps) {
  const { data: profileRes } = useMyProfileQuery(undefined);
  const profileUser = profileRes?.data || profileRes;
  const profile = profileUser?.profile || {};

  const [createCheckoutSession, { isLoading: isRedirectingToStripe }] =
    useCreateCheckoutSessionMutation();

  // Dynamic Contact & Address fields pre-filled from profile
  const [fullName, setFullName] = useState(contactName);
  const [billingEmail, setBillingEmail] = useState(contactEmail);
  const [billingAddress, setBillingAddress] = useState(propAddress);
  const [cityState, setCityState] = useState("");
  const [country, setCountry] = useState(propCountry);
  const [openCountry, setOpenCountry] = useState(false);

  // Agreement
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Sync state dynamically when profile or props change
  useEffect(() => {
    const resolvedName =
      contactName ||
      profile?.contactFullName ||
      [profileUser?.firstName, profileUser?.lastName].filter(Boolean).join(" ") ||
      "";
    if (resolvedName) setFullName(resolvedName);

    const resolvedEmail =
      contactEmail ||
      profile?.businessEmail ||
      profileUser?.email ||
      "";
    if (resolvedEmail) setBillingEmail(resolvedEmail);

    const resolvedAddress =
      propAddress ||
      profile?.businessAddress ||
      profile?.streetAddress ||
      "";
    if (resolvedAddress) setBillingAddress(resolvedAddress);

    const c = propCity || profile?.city || "";
    const s = propState || profile?.state || "";
    const z = propZip || profile?.zipCode || "";
    const formattedCityState = [c, s].filter(Boolean).join(", ") + (z ? ` ${z}` : "");
    if (formattedCityState) setCityState(formattedCityState);

    const resolvedCountry =
      propCountry && propCountry !== "United States"
        ? propCountry
        : profile?.country || "United States";
    if (resolvedCountry) setCountry(resolvedCountry);
  }, [profileUser, contactName, contactEmail, propAddress, propCity, propState, propZip, propCountry]);

  const handleSubmitActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;

    try {
      const res = await createCheckoutSession(selectedPlan.id).unwrap();
      if (res?.url) {
        toast.success("Redirecting to secure Stripe Checkout...");
        window.location.href = res.url;
      } else {
        toast.error("Failed to generate checkout session. Please try again.");
      }
    } catch (error: any) {
      console.error("Stripe session error:", error);
      const errMsg =
        error?.data?.message || error?.message || "Failed to start checkout. Please try again.";
      toast.error(errMsg);
    }
  };

  // Helper to parse portfolio size / units from profile safely
  const parseUnits = (val: any): number => {
    if (typeof val === "number" && !isNaN(val) && val > 0) return val;
    if (typeof val === "string") {
      if (val.includes("1-50")) return 50;
      if (val.includes("51-200")) return 200;
      if (val.includes("201-500")) return 500;
      if (val.includes("501+")) return 1000;
      const num = parseInt(val.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num) && num > 0) return num;
    }
    return 0;
  };

  const dynamicUnits =
    parseUnits(profile?.activeUnits) ||
    parseUnits(profile?.portfolioSize) ||
    (selectedPlan.activeUnits && selectedPlan.activeUnits > 0 ? selectedPlan.activeUnits : 500);

  const rate = selectedPlan.pricePerUnit || 1.0;
  const monthlyMin = selectedPlan.monthlyMinimum || 500;
  const calculatedTotal = Math.max(dynamicUnits * rate, monthlyMin);

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-[#4C127D] tracking-tight">
            Billing & Activation
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Complete your billing information to activate your workspace with Stripe.
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Plan</span>
          </button>
        )}
      </div>

      {/* Summary Card at top */}
      <div className="bg-[#F8F9FE] border border-purple-200/80 rounded-2xl p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-normal block">Selected Plan</span>
              <h3 className="text-base font-medium text-gray-900">{selectedPlan.name}</h3>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6B1294] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[#6B1294]" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-normal block">Verified Portfolio</span>
              <h3 className="text-base font-medium text-gray-900">
                {dynamicUnits.toLocaleString()} active units
              </h3>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:border-l md:border-purple-200/60 md:pl-6 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-normal">Rate</span>
            <span className="font-bold text-gray-900">${rate.toFixed(2)} per active unit/month</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-normal">Monthly Minimum</span>
            <span className="font-bold text-gray-900">${monthlyMin.toLocaleString()}</span>
          </div>

          <div className="pt-2 border-t border-purple-200/60">
            <span className="text-xs text-gray-500 font-normal block">Estimated Monthly Subscription</span>
            <span className="text-2xl sm:text-3xl font-medium text-[#4C127D]">
              ${calculatedTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmitActivation} className="space-y-6">
        {/* Billing Contact Section (Dynamically pre-filled from profile) */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-medium text-gray-900">Billing Contact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#6B1294]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Billing Email *
              </label>
              <input
                type="email"
                required
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="billing@example.com"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#6B1294]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Billing Address *
            </label>
            <input
              type="text"
              required
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Street Address or Suite"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#6B1294]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                City, State Zip *
              </label>
              <input
                type="text"
                required
                value={cityState}
                onChange={(e) => setCityState(e.target.value)}
                placeholder="City, State Zip"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#6B1294]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Country *
              </label>
              {/* Country Combobox */}
              <Popover open={openCountry} onOpenChange={setOpenCountry}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={openCountry}
                    className="w-full h-[42px] px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B1294]/20 focus:border-[#6B1294] shadow-none cursor-pointer flex items-center justify-between transition-colors hover:bg-gray-50"
                  >
                    <span className="truncate">
                      {country
                        ? countries.find((c) => c.value.toLowerCase() === country.toLowerCase())?.label || country
                        : "Select Country..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-gray-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] sm:w-[350px] p-0 bg-white rounded-xl border border-gray-200 shadow-xl z-[60]" align="start">
                  <Command>
                    <CommandInput placeholder="Search country..." className="h-9 text-xs" />
                    <CommandList className="max-h-[220px]">
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {countries.map((c) => (
                          <CommandItem
                            key={c.value}
                            value={c.value}
                            onSelect={(currentValue) => {
                              setCountry(currentValue === country ? "" : c.value);
                              setOpenCountry(false);
                            }}
                            className="flex items-center justify-between text-xs py-2 px-3 cursor-pointer rounded-lg font-medium text-gray-800 hover:bg-purple-50 hover:text-[#6B1294] transition-colors"
                          >
                            <span>{c.label}</span>
                            <Check
                              className={cn(
                                "h-4 w-4 text-[#6B1294] transition-opacity",
                                country.toLowerCase() === c.value.toLowerCase() ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Secure Stripe Checkout Banner (Replaces mock credit card & ACH selection) */}
        <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/40 p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6B1294] text-white flex items-center justify-center shadow-xs shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span>Secure Payment via Stripe Checkout</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6B1294]/10 text-[#6B1294]">
                    Official Partner
                  </span>
                </h3>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  Payment method entry is handled directly on Stripe&apos;s encrypted checkout.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              <CreditCard className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-gray-200/80 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Bank-Grade Security</p>
                <p className="text-[11px] text-gray-500">256-bit SSL encryption</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-gray-200/80 text-xs">
              <Lock className="w-4 h-4 text-[#6B1294] shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">PCI-DSS Level 1</p>
                <p className="text-[11px] text-gray-500">Zero card data on our servers</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-gray-200/80 text-xs">
              <Check className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Instant Activation</p>
                <p className="text-[11px] text-gray-500">Auto-activated upon payment</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-100/50 border border-purple-200/60 text-[11px] sm:text-xs text-purple-900 leading-relaxed">
            💡 <strong>How it works:</strong> You will be securely redirected to Stripe to enter your payment details (Credit/Debit Card, Apple Pay, Google Pay, or Bank Transfer). Your workspace activates automatically once payment is verified.
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="pt-2">
          <label className="flex items-center gap-2 text-xs text-gray-800 font-medium cursor-pointer">
            <input
              type="checkbox"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="rounded text-[#6B1294] focus:ring-purple-500 w-4 h-4"
            />
            <span>
              I agree to the{" "}
              <a href="#" className="text-[#6B1294] font-bold underline">
                ProjexPro Subscription Agreement
              </a>
              .
            </span>
          </label>
        </div>

        {/* Primary Activation Button */}
        <div>
          <button
            type="submit"
            disabled={!agreeTerms || isRedirectingToStripe}
            className="w-full py-4 px-6 bg-[#6B1294] hover:bg-[#580e7d] disabled:opacity-50 text-white font-bold rounded-2xl text-sm sm:text-base transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            {isRedirectingToStripe ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Redirecting to Secure Stripe Checkout...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Proceed to Secure Stripe Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Bottom Info Note */}
        <div className="flex items-start gap-2 text-[11px] text-gray-500 leading-relaxed pt-1">
          <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <span>
            Subscription fees cover the ProjexPro software platform. Service-provider work is quoted and invoiced separately after project authorization.
          </span>
        </div>
      </form>
    </div>
  );
}
