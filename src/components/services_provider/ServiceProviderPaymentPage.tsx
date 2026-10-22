"use client";

import React, { useState, useMemo } from "react";
import {
  DollarSign,
  Clock,
  TrendingUp,
  Plus,
  Landmark,
  CheckCircle2,
  Download,
  X,
  Building,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAllServiceRequestsQuery } from "@/features/serviceRequest/serviceRequestApi";
import { IServiceRequest } from "@/types/serviceRequest";

export default function ServiceProviderPaymentPage(): React.ReactElement {
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);

  // Bank Accounts state
  const [bankAccounts, setBankAccounts] = useState([
    {
      id: "1",
      bankName: "Chase Bank",
      accountHolder: "Provider Payout Account",
      accountType: "Checking",
      last4: "4892",
      routingLast4: "0142",
      isPrimary: true,
    },
  ]);

  const [newBankName, setNewBankName] = useState("");
  const [newAccountHolder, setNewAccountHolder] = useState("");
  const [newAccountType, setNewAccountType] = useState("Checking");
  const [newRoutingNumber, setNewRoutingNumber] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newConfirmAccountNumber, setNewConfirmAccountNumber] = useState("");
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({});

  // Query service requests assigned to the provider
  const { data: responseData, isLoading, isFetching, refetch } = useGetAllServiceRequestsQuery();

  const requests: IServiceRequest[] = useMemo(() => {
    if (!responseData?.data) return [];
    if (Array.isArray(responseData.data.requests)) {
      return responseData.data.requests;
    }
    if (Array.isArray(responseData.data)) {
      return responseData.data;
    }
    return [];
  }, [responseData]);

  // Calculations
  const completedJobs = useMemo(() => {
    return requests.filter((r) => r.status === "Completed");
  }, [requests]);

  const pendingApprovalJobs = useMemo(() => {
    return requests.filter((r) => r.status === "Pending Approval");
  }, [requests]);

  const totalEarnings = useMemo(() => {
    return completedJobs.reduce((sum, r) => sum + (r.finalPayout ?? r.basePayment ?? 0), 0);
  }, [completedJobs]);

  const pendingPayouts = useMemo(() => {
    return completedJobs
      .filter((r) => !r.isPaid)
      .reduce((sum, r) => sum + (r.finalPayout ?? r.basePayment ?? 0), 0);
  }, [completedJobs]);

  const openInvoicesAmount = useMemo(() => {
    return pendingApprovalJobs.reduce((sum, r) => sum + (r.finalPayout ?? r.basePayment ?? 0), 0);
  }, [pendingApprovalJobs]);

  // Payment rows for table
  const paymentRows = useMemo(() => {
    // Show completed and pending approval requests
    const relevantJobs = requests.filter(
      (r) => r.status === "Completed" || r.status === "Pending Approval"
    );

    return relevantJobs.map((job) => {
      const propertyName =
        typeof job.property === "object" && job.property
          ? job.property.title || job.property.name || "Property"
          : "Property";

      const amount = (job.finalPayout ?? job.basePayment ?? 0).toFixed(2);
      const dateStr = job.updatedAt
        ? new Date(job.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Recent";

      let status: "Paid" | "Unpaid" | "Processing" = "Processing";
      if (job.isPaid) {
        status = "Paid";
      } else if (job.status === "Pending Approval") {
        status = "Unpaid";
      } else {
        status = "Processing";
      }

      const invoiceNo =
        typeof job.invoice === "object" && job.invoice?.invoiceNo
          ? job.invoice.invoiceNo
          : `INV-${job._id.slice(-6).toUpperCase()}`;

      return {
        paymentId: invoiceNo,
        jobId: job.requestNo || job._id.slice(-6).toUpperCase(),
        propertyName,
        paymentDate: dateStr,
        amount: `$${amount}`,
        status,
      };
    });
  }, [requests]);

  const handleExport = () => {
    if (paymentRows.length === 0) {
      toast.error("No payment history to export.");
      return;
    }
    const headers = "Payment ID,Job ID,Property Name,Payment Date,Amount,Status\n";
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers +
      paymentRows
        .map(
          (r) =>
            `"${r.paymentId}","${r.jobId}","${r.propertyName}","${r.paymentDate}","${r.amount}","${r.status}"`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payment_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Payment history CSV exported successfully!");
  };

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!newBankName.trim()) errs.bankName = "Bank Name is required";
    if (!newAccountHolder.trim()) errs.accountHolder = "Account Holder (Name on Account) is required";
    if (!newRoutingNumber.trim()) errs.routingNumber = "Routing Number is required";
    if (!newAccountNumber.trim()) errs.accountNumber = "Account Number is required";
    if (!newConfirmAccountNumber.trim()) {
      errs.confirmAccountNumber = "Confirm Account Number is required";
    } else if (newAccountNumber.trim() !== newConfirmAccountNumber.trim()) {
      errs.confirmAccountNumber = "Account Numbers do not match";
    }

    if (Object.keys(errs).length > 0) {
      setModalErrors(errs);
      return;
    }

    const last4 = newAccountNumber.slice(-4) || "1234";
    const routingLast4 = newRoutingNumber.slice(-4) || "5678";

    setBankAccounts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        bankName: newBankName,
        accountHolder: newAccountHolder,
        accountType: newAccountType,
        last4,
        routingLast4,
        isPrimary: false,
      },
    ]);

    toast.success("Bank account added successfully!");
    setNewBankName("");
    setNewAccountHolder("");
    setNewAccountNumber("");
    setNewConfirmAccountNumber("");
    setNewRoutingNumber("");
    setModalErrors({});
    setIsAddAccountModalOpen(false);
  };

  const getStatusBadge = (status: "Paid" | "Unpaid" | "Processing") => {
    switch (status) {
      case "Paid":
        return (
          <span className="px-3.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Paid
          </span>
        );
      case "Unpaid":
        return (
          <span className="px-3.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 inline-block">
            Unpaid
          </span>
        );
      case "Processing":
        return (
          <span className="px-3.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 inline-block">
            Processing
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Invoices & Payments
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
            Track your earnings, monitor your pending payouts, and view invoice status for completed jobs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#6B1294]" : "text-gray-500"}`} />
          <span>{isFetching ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Top 3 Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Earnings */}
        <div className="bg-[#16A34A] rounded-lg p-6 text-white shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-semibold text-white/95">
              Total Earnings
            </span>
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-medium tracking-tight">
              ${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-white/80 font-normal mt-2">
              From {completedJobs.length} completed work orders
            </p>
          </div>
        </div>

        {/* Card 2: Pending Payouts */}
        <div className="bg-yellow-500 rounded-lg p-6 text-white shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-semibold text-white/95">
              Pending Payouts
            </span>
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-medium tracking-tight">
              ${pendingPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-white/80 font-normal mt-2">
              Processing for deposit
            </p>
          </div>
        </div>

        {/* Card 3: Open Invoices */}
        <div className="bg-[#7C3AED] rounded-lg p-6 text-white shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-semibold text-white/95">
              Awaiting PM Approval
            </span>
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-medium tracking-tight">
              ${openInvoicesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-white/80 font-normal mt-2">
              {pendingApprovalJobs.length} job{pendingApprovalJobs.length === 1 ? "" : "s"} submitted
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods Section Container */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Payout Bank Account
          </h2>
          <button
            type="button"
            onClick={() => setIsAddAccountModalOpen(true)}
            className="bg-[#5B1B95] hover:bg-[#4C127D] text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>

        {/* Tab / Category Pill */}
        <div className="bg-[#F2E7FC] border border-[#6B1294]/30 text-[#6B1294] py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm w-full text-center">
          <Landmark className="w-4 h-4" />
          <span>Direct Deposit / ACH Account</span>
        </div>

        {/* Bank Accounts List */}
        <div className="space-y-3">
          {bankAccounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white border border-[#6B1294]/30 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">
                  {acc.bankName} — {acc.accountType}
                </h3>
                <p className="text-xs text-gray-700 font-medium">
                  Account Holder: <span className="font-semibold text-gray-900">{acc.accountHolder}</span>
                </p>
                <p className="text-xs text-gray-500 font-mono tracking-widest">
                  Account #: •••• •••• {acc.last4}
                </p>
                <p className="text-xs text-gray-400 font-normal">
                  Routing #: •••••{acc.routingLast4}
                </p>
              </div>

              {acc.isPrimary && (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 w-fit">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Primary Payout
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment History Section Container */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Payment & Invoice History
            </h2>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Live payouts and invoices tied to your completed work orders.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-300/60 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3.5 px-4">Invoice / Pay ID</th>
                <th className="py-3.5 px-4">Job ID</th>
                <th className="py-3.5 px-4">Property Name</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Payout Amount</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/40 text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#6B1294]" />
                      <span>Loading payment history...</span>
                    </div>
                  </td>
                </tr>
              ) : paymentRows.length > 0 ? (
                paymentRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-purple-50/20 transition-colors"
                  >
                    <td className="py-4 px-4 font-bold text-[#6B1294]">
                      {row.paymentId}
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-700">
                      {row.jobId}
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {row.propertyName}
                    </td>
                    <td className="py-4 px-4 font-normal text-gray-500">
                      {row.paymentDate}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900">
                      {row.amount}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(row.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                    No completed payments or open invoices found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bank Account Modal */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] rounded-lg p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-[#E5E7EB] relative space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#6B1294] italic block">Enter Bank Details</span>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#6B1294]" />
                  <span>Add Bank Account</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAccountModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 cursor-pointer p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={newBankName}
                  onChange={(e) => {
                    setNewBankName(e.target.value);
                    if (e.target.value) setModalErrors((p) => ({ ...p, bankName: "" }));
                  }}
                  placeholder="e.g. Chase Bank, Bank of America"
                  className={`w-full h-[46px] px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all ${
                    modalErrors.bankName
                      ? "border-red-500 bg-red-50/20"
                      : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
                  }`}
                />
                {modalErrors.bankName && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">
                    ⚠️ {modalErrors.bankName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Account Holder (Name on Account) *
                </label>
                <input
                  type="text"
                  value={newAccountHolder}
                  onChange={(e) => {
                    setNewAccountHolder(e.target.value);
                    if (e.target.value) setModalErrors((p) => ({ ...p, accountHolder: "" }));
                  }}
                  placeholder="e.g. John Doe"
                  className={`w-full h-[46px] px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all ${
                    modalErrors.accountHolder
                      ? "border-red-500 bg-red-50/20"
                      : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
                  }`}
                />
                {modalErrors.accountHolder && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">
                    ⚠️ {modalErrors.accountHolder}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Account Type *
                </label>
                <Select
                  value={newAccountType}
                  onValueChange={(val) => setNewAccountType(val)}
                >
                  <SelectTrigger className="w-full h-[46px] px-4 py-3 bg-white border border-gray-300 py-5.5 rounded-lg text-sm text-gray-900 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 focus:outline-none transition-all cursor-pointer shadow-none">
                    <SelectValue placeholder="Select Account Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-lg border border-gray-200 shadow-lg z-[70]">
                    <SelectItem value="Checking">Checking</SelectItem>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Routing Number *
                </label>
                <input
                  type="text"
                  value={newRoutingNumber}
                  onChange={(e) => {
                    setNewRoutingNumber(e.target.value);
                    if (e.target.value) setModalErrors((p) => ({ ...p, routingNumber: "" }));
                  }}
                  placeholder="9-digit routing number"
                  className={`w-full h-[46px] px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all ${
                    modalErrors.routingNumber
                      ? "border-red-500 bg-red-50/20"
                      : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
                  }`}
                />
                {modalErrors.routingNumber && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">
                    ⚠️ {modalErrors.routingNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Account Number *
                </label>
                <input
                  type="password"
                  value={newAccountNumber}
                  onChange={(e) => {
                    setNewAccountNumber(e.target.value);
                    if (e.target.value) setModalErrors((p) => ({ ...p, accountNumber: "" }));
                  }}
                  placeholder="Enter Account Number"
                  className={`w-full h-[46px] px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all ${
                    modalErrors.accountNumber
                      ? "border-red-500 bg-red-50/20"
                      : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
                  }`}
                />
                {modalErrors.accountNumber && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">
                    ⚠️ {modalErrors.accountNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Confirm Account Number *
                </label>
                <input
                  type="text"
                  value={newConfirmAccountNumber}
                  onChange={(e) => {
                    setNewConfirmAccountNumber(e.target.value);
                    if (e.target.value) setModalErrors((p) => ({ ...p, confirmAccountNumber: "" }));
                  }}
                  placeholder="Re-enter Account Number"
                  className={`w-full h-[46px] px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all ${
                    modalErrors.confirmAccountNumber
                      ? "border-red-500 bg-red-50/20"
                      : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
                  }`}
                />
                {modalErrors.confirmAccountNumber && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">
                    ⚠️ {modalErrors.confirmAccountNumber}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#5B1B95] hover:bg-[#4C127D] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
