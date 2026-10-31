"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useMyProfileQuery } from "@/features/profile/profileApi";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(5);

  const { refetch } = useMyProfileQuery(undefined);

  useEffect(() => {
    // Clear verification cache
    if (typeof window !== "undefined") {
      localStorage.removeItem("projexpro_verification_step");
      localStorage.removeItem("projexpro_verification_plan");
      localStorage.removeItem("projexpro_verification_form_data");
    }

    // Refresh profile to update subscribe: true
    refetch();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.replace("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [refetch, router]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-lg w-full p-8 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Success Icon */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-50" />
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center relative z-10 shadow-lg">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full inline-flex items-center gap-1.5 border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Payment Confirmed</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-medium text-[#2E0054] tracking-tight">
            Workspace Activated!
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed max-w-sm mx-auto">
            Your ProjexPro subscription is active. Your Property Manager workspace and tools have been successfully unlocked.
          </p>
        </div>

        {sessionId && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-500 font-mono break-all text-left">
            <span className="font-semibold block text-gray-700 font-sans">Session Reference:</span>
            {sessionId}
          </div>
        )}

        {/* Benefits reminder */}
        <div className="p-4 bg-purple-50/70 border border-purple-200/60 rounded-2xl text-left space-y-1.5 text-xs text-purple-950">
          <div className="flex items-center gap-2 font-bold text-[#6B1294]">
            <ShieldCheck className="w-4 h-4" />
            <span>Ready to Manage</span>
          </div>
          <p className="text-gray-700 text-[11px] leading-relaxed">
            You can now create property listings, issue service requests, evaluate contractor bids, and track turnovers seamlessly.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="w-full py-4 px-6 bg-[#6B1294] hover:bg-[#580e7d] text-white font-bold rounded-2xl text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <span>Enter ProjexPro Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-gray-400">
            Automatically redirecting to your dashboard in {countdown} seconds...
          </p>
        </div>

      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">Loading...</div>}>
      <PaymentSuccessContent />
    </React.Suspense>
  );
}
