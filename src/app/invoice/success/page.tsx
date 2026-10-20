"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, FileText, Sparkles, Loader2 } from "lucide-react";
import { useGetSingleInvoiceQuery } from "@/features/invoice/invoiceApi";

function InvoiceSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const invoiceId = searchParams.get("invoice_id") || "";
  const [countdown, setCountdown] = useState(8);

  const { data: invoiceRes, isLoading } = useGetSingleInvoiceQuery(invoiceId, {
    skip: !invoiceId,
  });

  const invoice = invoiceRes?.data;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.replace("/invoices");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

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

        {/* Header Text */}
        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full inline-flex items-center gap-1.5 border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Payment Successful</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2E0054] tracking-tight">
            Invoice Paid!
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed max-w-sm mx-auto">
            Your maintenance invoice payment has been confirmed by Stripe. The service request records have been updated.
          </p>
        </div>

        {/* Invoice Summary Box */}
        {isLoading ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin text-[#6B1294]" />
            <span>Retrieving invoice confirmation...</span>
          </div>
        ) : invoice ? (
          <div className="bg-purple-50/70 border border-purple-200/60 rounded-2xl p-4 text-left space-y-2 text-xs text-purple-950">
            <div className="flex items-center justify-between border-b border-purple-200/50 pb-2">
              <span className="text-gray-500 font-medium">Invoice Number</span>
              <span className="font-bold text-[#6B1294] text-sm">{invoice.invoiceNo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Amount Paid</span>
              <span className="font-bold text-emerald-600 text-base">
                ${invoice.paidAmount || invoice.totalAmount || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Payment Status</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                {invoice.status}
              </span>
            </div>
          </div>
        ) : null}

        {/* Session reference */}
        {sessionId && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-500 font-mono break-all text-left">
            <span className="font-semibold block text-gray-700 font-sans">Stripe Session:</span>
            {sessionId}
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
            <span>Go to Invoices</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => router.replace("/service-requests")}
            className="w-full py-3 px-6 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <span>View Service Requests</span>
          </button>

          <p className="text-[11px] text-gray-400">
            Redirecting to Invoices in {countdown} seconds...
          </p>
        </div>

      </div>
    </div>
  );
}

export default function InvoiceSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-sm text-gray-500">Loading payment status...</div>}>
      <InvoiceSuccessContent />
    </Suspense>
  );
}
