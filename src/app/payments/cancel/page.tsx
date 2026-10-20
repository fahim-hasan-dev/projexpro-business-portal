"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl max-w-lg w-full p-8 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Cancel Icon */}
        <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-500 text-amber-600 flex items-center justify-center mx-auto shadow-lg">
          <XCircle className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full inline-flex items-center gap-1.5 border border-amber-300">
            <span>Checkout Incomplete</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-medium text-[#2E0054] tracking-tight">
            Payment Not Completed
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed max-w-sm mx-auto">
            You exited the Stripe payment checkout. No charges were made to your account. You can select your plan and activate whenever you are ready.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => router.replace("/provider-manager/verification")}
            className="w-full py-4 px-6 bg-[#6B1294] hover:bg-[#580e7d] text-white font-bold rounded-2xl text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Plan Selection</span>
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3.5 px-6 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
            <span>Try Again</span>
          </button>
        </div>

      </div>
    </div>
  );
}
