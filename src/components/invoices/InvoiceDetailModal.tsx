"use client";

import React from "react";
import Image from "next/image";
import { Check, Download, X, Loader2 } from "lucide-react";
import { Invoice } from "@/types/invoice";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import toast from "react-hot-toast";
import { usePayInvoiceMutation } from "@/features/invoice/invoiceApi";

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onPaySuccess?: (id: string) => void;
}

export default function InvoiceDetailModal({
  invoice,
  onClose,
  onPaySuccess,
}: InvoiceDetailModalProps) {
  const [payInvoice, { isLoading: isPaying }] = usePayInvoiceMutation();

  if (!invoice) return null;

  // Currency helper
  const fmt = (val?: number) => {
    if (val === undefined || val === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handlePayNow = async () => {
    const targetId = invoice._id || invoice.id;
    if (!targetId) return;

    try {
      const res = await payInvoice(targetId).unwrap();
      if (res.data?.checkoutUrl) {
        toast.loading("Redirecting to Stripe secure checkout...");
        onPaySuccess?.(targetId);
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error("Checkout session URL not received");
      }
    } catch (err: any) {
      console.error("Pay invoice error:", err);
      const msg = err?.data?.message || err?.message || "Failed to initiate payment";
      toast.error(msg);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const isPaid = invoice.status === "Paid";
  const isDeposit = invoice.status === "Deposit" || invoice.status === "Pending" || invoice.status === "Unpaid";

  const items =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : invoice.lineItems && invoice.lineItems.length > 0
      ? invoice.lineItems
      : [
          {
            description: invoice.description || "Service Request Maintenance Work",
            qty: 1,
            unitPrice: invoice.totalAmount || 0,
            amount: invoice.totalAmount || 0,
          },
        ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-lg p-6 sm:p-8 max-w-2xl w-full shadow-2xl overflow-hidden relative max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 ease-out">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-4">
            <Image
              src="/logo/logo.png"
              alt="ProjexPro Logo"
              width={160}
              height={45}
              className="h-9 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {invoice.invoiceNo || invoice.id}
            </h2>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {invoice.description}
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto custom-scrollbar pr-2 space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs sm:text-sm bg-gray-50/80 p-4 rounded-lg border border-gray-100">
            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                PROPERTY NAME
              </span>
              <span className="font-semibold text-gray-900 mt-0.5 block">
                {invoice.property}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                CONTRACTOR / PROVIDER
              </span>
              <span className="font-semibold text-gray-900 mt-0.5 block">
                {invoice.serviceProvider}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                JOB ID
              </span>
              <span className="font-semibold text-gray-900 mt-0.5 block">
                {invoice.accountId || invoice.id}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                DUE DATE
              </span>
              <span className="font-semibold text-gray-900 mt-0.5 block">
                {invoice.dueDate || "30 Days from Issue"}
              </span>
            </div>

            {invoice.invoiceNo && (
              <div>
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  INVOICE NO.
                </span>
                <span className="font-semibold text-gray-900 mt-0.5 block">
                  {invoice.invoiceNo}
                </span>
              </div>
            )}

            {invoice.issueDate && (
              <div>
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  ISSUE DATE
                </span>
                <span className="font-semibold text-gray-900 mt-0.5 block">
                  {invoice.issueDate}
                </span>
              </div>
            )}
          </div>

          {/* Line Items Table Box */}
          <div className="bg-[#EDEDF0] rounded-lg p-4">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-300/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300/40 text-gray-800">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-medium">{item.description}</td>
                    <td className="py-2.5 text-center">{item.qty}</td>
                    <td className="py-2.5 text-right">{fmt(item.unitPrice)}</td>
                    <td className="py-2.5 text-right font-semibold">{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Final Calculation */}
          <div className="space-y-2 text-xs sm:text-sm text-gray-600 border-b border-gray-200 pb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">
                {fmt(invoice.subtotal !== undefined ? invoice.subtotal : invoice.totalAmount)}
              </span>
            </div>
            {invoice.tax !== undefined && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-semibold text-gray-900">{fmt(invoice.tax)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Total Amount</span>
              <span className="font-semibold text-gray-900">{fmt(invoice.totalAmount)}</span>
            </div>
            {invoice.deposit ? (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Deposit / Paid</span>
                <span>-{fmt(invoice.deposit)}</span>
              </div>
            ) : null}
          </div>

          {/* Highlighted Big Amount */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-base sm:text-lg font-bold text-gray-900">
              {isPaid ? "Total Paid" : "Balance Due"}
            </span>
            <span className="text-2xl sm:text-3xl font-medium text-[#7C3AED]">
              {isPaid ? fmt(invoice.totalAmount) : fmt(invoice.totalDue)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className={`py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                isPaid ? "w-full" : "flex-1"
              }`}
            >
              <Download className="w-4 h-4 text-gray-600" />
              <span>Print / Download PDF</span>
            </button>

            {!isPaid && (
              <button
                type="button"
                onClick={handlePayNow}
                disabled={isPaying}
                className="flex-1 py-3.5 px-4 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-semibold rounded-lg text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isPaying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
                <span>{isPaying ? "Processing..." : "Pay Now via Stripe"}</span>
              </button>
            )}
          </div>

          {/* Payment Terms Notice */}
          {!isPaid && (
            <p className="text-[11px] text-gray-400 font-normal leading-relaxed text-center pt-1">
              <span className="font-semibold text-gray-600">Payment Security:</span> Powered by Stripe.
              Your card and billing details are protected with bank-level encryption.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
