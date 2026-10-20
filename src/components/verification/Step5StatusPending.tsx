"use client";

import { Clock, Shield, AlertCircle, RefreshCw, ArrowRight, RotateCcw } from "lucide-react";
import { VerificationFormData } from "@/types/verification";

interface Step5StatusPendingProps {
  formData: VerificationFormData;
  approvalStatus?: string;
  rejectionReason?: string;
  isServiceProvider?: boolean;
  onAdminApproved?: () => void;
  onResubmit?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Step5StatusPending({
  formData,
  approvalStatus = "pending",
  rejectionReason,
  isServiceProvider = false,
  onResubmit,
  onRefresh,
  isRefreshing = false,
}: Step5StatusPendingProps) {
  const isRejected = approvalStatus === "rejected";
  const isResubmitted = approvalStatus === "resubmitted";

  if (isRejected) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-8 px-4 text-center animate-in fade-in duration-300">
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-red-100 border-2 border-red-500 text-red-600 flex items-center justify-center shadow-lg">
            <AlertCircle className="w-10 h-10" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-red-300">
            <span>Action Required: Application Rejected</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-medium text-[#2E0054] tracking-tight">
            Application Needs Revision
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-normal max-w-lg mx-auto leading-relaxed">
            Our platform administrator reviewed your submission for <strong className="text-gray-900">{formData.companyName || "your organization"}</strong> and requested updates.
          </p>
        </div>

        {/* Rejection Reason Card */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-left max-w-lg mx-auto space-y-1.5 shadow-sm">
          <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">
            Feedback from Administrator:
          </h4>
          <p className="text-sm text-red-800 font-medium">
            {rejectionReason || "Please review and update your organization information and resubmit."}
          </p>
        </div>

        {/* Action Button to Resubmit */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onResubmit && (
            <button
              type="button"
              onClick={onResubmit}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#6B1294] hover:bg-[#580e7d] text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Update & Resubmit Application</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto px-5 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#6B1294]" : ""}`} />
              <span>{isRefreshing ? "Checking..." : "Refresh Status"}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8 px-4 text-center animate-in fade-in duration-300">
      {/* Animated Shield / Pulse Icon */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping" />
        <div className="w-20 h-20 rounded-full bg-purple-100 border-2 border-[#5B1B95] text-[#5B1B95] flex items-center justify-center shadow-lg relative z-10">
          <Shield className="w-10 h-10 animate-bounce" />
        </div>
      </div>

      {/* Header text */}
      <div className="space-y-2">
        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
          <span>{isResubmitted ? "Resubmission Under Review" : "Admin Review In Progress"}</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-medium text-[#2E0054] tracking-tight">
          Your Documents Are Being Reviewed
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 font-normal max-w-lg mx-auto leading-relaxed">
          Thank you, <strong className="text-gray-900">{formData.fullName || "User"}</strong>. Our ProjexPro platform admin is reviewing <strong className="text-gray-900">{formData.companyName || "your organization"}</strong>&apos;s verification application.
        </p>
      </div>

      {/* Role-specific explanation */}
      <div className="bg-purple-50/70 border border-purple-200/60 rounded-2xl p-4 sm:p-5 max-w-lg mx-auto text-left space-y-1.5 text-xs text-purple-950 leading-relaxed">
        <h4 className="font-bold text-[#6B1294] text-xs uppercase tracking-wide">
          What happens next?
        </h4>
        <p className="text-gray-700">
          {isServiceProvider
            ? "Once approved by our administrator, your service provider account will be immediately activated and you will gain direct access to your workspace."
            : "Once approved by our administrator, you will be invited to select your subscription plan and activate your Property Manager workspace."}
        </p>
      </div>

      {/* Refresh Status Button */}
      {onRefresh && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#6B1294]" : "text-gray-500"}`} />
            <span>{isRefreshing ? "Checking status..." : "Check Approval Status"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

