"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft, RefreshCw, FileText } from "lucide-react";

function InvoiceCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice_id");

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
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2E0054] tracking-tight">
            Invoice Payment Cancelled
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed max-w-sm mx-auto">
            You exited the Stripe checkout session. No charges were made to your card or account. You can complete this payment whenever convenient.
          </p>
        </div>

        {invoiceId && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-500 font-mono break-all text-left">
            <span className="font-semibold block text-gray-700 font-sans">Invoice ID Reference:</span>
            {invoiceId}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => router.replace("/invoices")}
            className="w-full py-4 px-6 bg-[#6B1294] hover:bg-[#580e7d] text-white font-bold rounded-2xl text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Return to Invoices</span>
          </button>

          <button
            type="button"
            onClick={() => router.replace("/service-requests")}
            className="w-full py-3.5 px-6 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            <span>Back to Service Requests</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default function InvoiceCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-sm text-gray-500">Loading cancel page...</div>}>
      <InvoiceCancelContent />
    </Suspense>
  );
}
