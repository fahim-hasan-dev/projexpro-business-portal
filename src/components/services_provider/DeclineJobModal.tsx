"use client";

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface DeclineJobModalProps {
  isOpen: boolean;
  jobId: string;
  jobRequestNo?: string;
  onClose: () => void;
  onSubmitDecline: (reason: string) => void;
  isLoading?: boolean;
}

export default function DeclineJobModal({
  isOpen,
  jobId,
  jobRequestNo,
  onClose,
  onSubmitDecline,
  isLoading = false,
}: DeclineJobModalProps) {
  const [reason, setReason] = useState("");
  const [selectedQuickReason, setSelectedQuickReason] = useState("");

  if (!isOpen) return null;

  const quickReasons = [
    "Schedule conflict / Already fully booked",
    "Missing required tools / specialized equipment",
    "Job site location out of service radius",
    "Safety concern on property",
    "Scope requires additional specialized license",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason.trim() || selectedQuickReason;
    if (!finalReason) return;
    onSubmitDecline(finalReason);
    setReason("");
    setSelectedQuickReason("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative border border-gray-200 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Decline Job Request #{jobRequestNo || jobId}
              </h2>
              <p className="text-xs text-gray-500 font-normal mt-0.5">
                Please state your reason for declining. This request will be returned to Super Admin for reassignment.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Quick Reasons */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select Quick Reason
            </label>
            <div className="space-y-2">
              {quickReasons.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setSelectedQuickReason(q);
                    setReason(q);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                    selectedQuickReason === q || reason === q
                      ? "bg-red-50 border-red-300 text-red-800 font-bold"
                      : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Explanation */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Detailed Reason / Additional Notes
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setSelectedQuickReason("");
              }}
              placeholder="Explain why you cannot take this job..."
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          {/* Alert box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 leading-relaxed">
            <strong>Note:</strong> Super Admin will review your decline reason and reassign the request to an available Service Provider.
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer text-center border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || isLoading}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-xs text-center"
            >
              {isLoading ? "Submitting..." : "Submit Decline Request"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
