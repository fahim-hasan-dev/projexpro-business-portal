"use client";

import React, { useMemo, useState } from "react";
import { Invoice, InvoiceStatus, IInvoice } from "@/types/invoice";
import InvoiceStatsCards from "@/components/invoices/InvoiceStatsCards";
import InvoiceFilters, { FilterTab } from "@/components/invoices/InvoiceFilters";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import InvoiceDetailModal from "@/components/invoices/InvoiceDetailModal";
import toast from "react-hot-toast";
import { useGetMyInvoicesQuery, usePayInvoiceMutation } from "@/features/invoice/invoiceApi";
import { Loader2, RefreshCw } from "lucide-react";

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("All Invoices");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Fetch live invoices from backend for the logged-in Property Manager
  const {
    data: invoicesRes,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMyInvoicesQuery();

  const [payInvoice, { isLoading: isPaying }] = usePayInvoiceMutation();

  // Transform backend IInvoice[] into UI-compatible Invoice[]
  const invoices: Invoice[] = useMemo(() => {
    const rawList = invoicesRes?.data?.invoices;
    if (!rawList || !Array.isArray(rawList)) return [];

    return rawList.map((inv: IInvoice) => {
      const prop = typeof inv.property === "object" && inv.property !== null ? inv.property : null;
      const propName = prop?.name || prop?.title || prop?.address || "Assigned Property";
      const sr = typeof inv.serviceRequest === "object" && inv.serviceRequest !== null ? inv.serviceRequest : null;
      const sp = typeof inv.serviceProvider === "object" && inv.serviceProvider !== null ? inv.serviceProvider : null;
      const providerName = sp?.firstName
        ? `${sp.firstName} ${sp.lastName || ""}`.trim()
        : sp?.userName || "Assigned Contractor";
      const issueTitle =
        sr?.issueTitle || (inv.items && inv.items[0]?.description) || "Property Maintenance Work";

      const isPastDue = inv.dueDate && new Date(inv.dueDate).getTime() < Date.now();
      let computedStatus: InvoiceStatus = inv.status;
      if (inv.status === "Paid" || (inv.balanceDue !== undefined && inv.balanceDue <= 0)) {
        computedStatus = "Paid";
      } else if (isPastDue) {
        computedStatus = "Overdue";
      } else if (inv.paidAmount > 0) {
        computedStatus = "Deposit";
      } else {
        computedStatus = "Pending";
      }

      const startDateStr = inv.createdAt
        ? new Date(inv.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "N/A";

      const dueDateStr = inv.dueDate
        ? new Date(inv.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : undefined;

      const issueDateStr = inv.createdAt
        ? new Date(inv.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : undefined;

      const finalInvoiceDateStr = inv.updatedAt
        ? new Date(inv.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : undefined;

      return {
        _id: inv._id,
        id: inv.invoiceNo || (inv._id ? inv._id.slice(-6).toUpperCase() : "INV"),
        invoiceNo: inv.invoiceNo,
        description: issueTitle,
        property: propName,
        serviceProvider: providerName,
        totalAmount: inv.totalAmount || 0,
        deposit: inv.paidAmount || 0,
        totalDue: inv.balanceDue ?? Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)),
        status: computedStatus,
        startDate: startDateStr,
        dueDate: dueDateStr,
        issueDate: issueDateStr,
        finalInvoiceDate: finalInvoiceDateStr,
        accountId: inv.jobId || sr?.requestNo || inv.invoiceNo,
        serviceRequestTitle: issueTitle,
        lineItems: inv.items,
        items: inv.items,
        subtotal: inv.subtotal,
        tax: inv.tax,
        raw: inv,
      };
    });
  }, [invoicesRes]);

  // Calculate Statistics dynamically from live invoices
  const stats = useMemo(() => {
    const totalCount = invoices.length;

    const overdueCount = invoices.filter((inv) => inv.status === "Overdue").length;

    const pendingCount = invoices.filter(
      (inv) => inv.status === "Pending" || inv.status === "Deposit" || inv.status === "Unpaid"
    ).length;

    const paidCount = invoices.filter((inv) => inv.status === "Paid").length;

    const totalBalanceDue = invoices
      .filter((inv) => inv.status !== "Paid")
      .reduce((sum, inv) => sum + (inv.totalDue || 0), 0);

    const paidHistoryAmount = invoices.reduce(
      (sum, inv) => sum + (inv.deposit || (inv.status === "Paid" ? inv.totalAmount : 0)),
      0
    );

    return {
      totalCount,
      overdueCount,
      pendingCount,
      paidCount,
      totalBalanceDue,
      paidHistoryAmount,
    };
  }, [invoices]);

  // Filter Invoices by Tab and Search Query
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Tab filter
      let matchesTab = true;
      if (activeTab === "Pending") {
        matchesTab = inv.status === "Pending" || inv.status === "Deposit" || inv.status === "Unpaid";
      } else if (activeTab === "Overdue") {
        matchesTab = inv.status === "Overdue";
      } else if (activeTab === "Paid") {
        matchesTab = inv.status === "Paid";
      }

      // 2. Search filter
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(q)) ||
        inv.description.toLowerCase().includes(q) ||
        inv.property.toLowerCase().includes(q) ||
        inv.serviceProvider.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [invoices, activeTab, searchTerm]);

  // Action: Pay / Approve Invoice via Stripe Checkout
  const handlePayInvoice = async (id: string) => {
    const target = invoices.find((inv) => inv.id === id || inv._id === id);
    const targetId = target?._id || id;

    if (!targetId) {
      toast.error("Invoice reference not found");
      return;
    }

    try {
      toast.loading("Initiating Stripe payment checkout...", { id: "pay-invoice" });
      const res = await payInvoice(targetId).unwrap();
      if (res.data?.checkoutUrl) {
        toast.success("Redirecting to Stripe secure checkout...", { id: "pay-invoice" });
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error("Checkout session URL not received", { id: "pay-invoice" });
      }
    } catch (err: any) {
      console.error("Pay invoice error:", err);
      const msg = err?.data?.message || err?.message || "Failed to initiate checkout";
      toast.error(msg, { id: "pay-invoice" });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Invoices & Payments
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Track your maintenance expenses, approve outstanding balances, and pay invoices via Stripe.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#6B1294]" : "text-gray-500"}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 Summary Stats Cards */}
      <InvoiceStatsCards
        totalBalanceDue={stats.totalBalanceDue}
        overdueCount={stats.overdueCount}
        pendingCount={stats.pendingCount}
        paidHistoryAmount={stats.paidHistoryAmount}
      />

      {/* Tabs Filter & Search Row */}
      <InvoiceFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        counts={{
          all: stats.totalCount,
          pending: stats.pendingCount,
          overdue: stats.overdueCount,
          paid: stats.paidCount,
        }}
      />

      {/* Loading state indicator */}
      {isLoading ? (
        <div className="bg-white rounded-lg p-16 text-center border border-gray-200/90 shadow-2xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#8E25E3] animate-spin" />
          <p className="text-sm font-semibold text-gray-700">Loading invoices from server...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg p-12 text-center border border-red-200 shadow-2xs space-y-3">
          <p className="text-red-600 font-semibold text-sm">Failed to load invoices from server.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#8E25E3] text-white text-xs font-semibold rounded-lg hover:bg-[#791ecc] cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        /* Main Data Table */
        <InvoiceTable
          invoices={filteredInvoices}
          onViewInvoice={(inv) => setSelectedInvoice(inv)}
          onPayInvoice={handlePayInvoice}
        />
      )}

      {/* Invoice Detail Popup Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onPaySuccess={(id) => {
          setSelectedInvoice(null);
          refetch();
        }}
      />
    </div>
  );
}