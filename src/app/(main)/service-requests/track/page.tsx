"use client";

import {
  Calendar,
  Check,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Loader2,
  FileText,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import React, { Suspense, useState } from "react";
import toast from "react-hot-toast";
import {
  useGetSingleServiceRequestQuery,
  useUpdateServiceRequestStatusMutation,
} from "@/features/serviceRequest/serviceRequestApi";
import {
  usePayInvoiceMutation,
  usePayInvoiceByServiceRequestMutation,
} from "@/features/invoice/invoiceApi";
import { getPropertyImageUrl } from "@/utils/propertyUtils";

function TrackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reqId = searchParams.get("id") || "";

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Fetch single service request live from backend
  const {
    data: requestRes,
    isLoading,
    isError,
    refetch,
  } = useGetSingleServiceRequestQuery(reqId, {
    skip: !reqId,
  });

  const [updateStatus, { isLoading: isUpdating }] = useUpdateServiceRequestStatusMutation();
  const [payInvoice, { isLoading: isPayingInvoice }] = usePayInvoiceMutation();
  const [payBySR, { isLoading: isPayingBySR }] = usePayInvoiceByServiceRequestMutation();

  const currentJob = requestRes?.data;

  // Handler: Pay Invoice via Stripe Checkout
  const handlePayInvoice = async (invoiceId?: string) => {
    if (!currentJob) return;
    try {
      toast.loading("Initiating Stripe payment checkout...", { id: "track-pay" });
      let res;
      if (invoiceId) {
        res = await payInvoice(invoiceId).unwrap();
      } else {
        res = await payBySR(currentJob._id).unwrap();
      }
      if (res.data?.checkoutUrl) {
        toast.success("Redirecting to Stripe checkout...", { id: "track-pay" });
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error("Checkout session URL not received", { id: "track-pay" });
      }
    } catch (err: any) {
      console.error("Pay invoice error:", err);
      const msg = err?.data?.message || err?.message || "Failed to initiate payment";
      toast.error(msg, { id: "track-pay" });
    }
  };

  // Handler: Property Manager confirms completion when status is Pending Approval
  const handleConfirmCompletion = async () => {
    if (!currentJob) return;
    try {
      await updateStatus({
        id: currentJob._id,
        data: {
          status: "Completed",
          note: "Work completion verified and approved by Property Manager.",
        },
      }).unwrap();
      toast.success("Work verified! Service request marked as Completed.");
      refetch();
    } catch (err: any) {
      console.error("Confirm completion error:", err);
      const msg = err?.data?.message || err?.message || "Failed to confirm completion";
      toast.error(msg);
    }
  };

  // Handler: Cancel request
  const handleCancelRequest = async () => {
    if (!currentJob) return;
    if (!window.confirm("Are you sure you want to cancel this service request?")) return;
    try {
      await updateStatus({
        id: currentJob._id,
        data: {
          status: "Cancelled",
          reason: "Cancelled by Property Manager",
        },
      }).unwrap();
      toast.success("Service request has been cancelled.");
      refetch();
    } catch (err: any) {
      console.error("Cancel request error:", err);
      const msg = err?.data?.message || err?.message || "Failed to cancel service request";
      toast.error(msg);
    }
  };

  if (!reqId) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">No Request ID Provided</h2>
        <p className="text-sm text-gray-500">Please select a service request from the list to track its progress.</p>
        <button
          type="button"
          onClick={() => router.push("/service-requests")}
          className="py-2.5 px-5 bg-[#6B1294] text-white rounded-lg font-semibold text-sm hover:bg-[#580e7d] transition-colors cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Service Requests</span>
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-16 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#6B1294] animate-spin" />
        <p className="text-sm font-semibold text-gray-700">Loading service request details...</p>
      </div>
    );
  }

  if (isError || !currentJob) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center max-w-lg mx-auto space-y-4">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Service Request Not Found</h2>
        <p className="text-sm text-gray-500">
          The requested work order could not be loaded or you do not have permission to view it.
        </p>
        <button
          type="button"
          onClick={() => router.push("/service-requests")}
          className="py-2.5 px-5 bg-[#6B1294] text-white rounded-lg font-semibold text-sm hover:bg-[#580e7d] transition-colors cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Service Requests</span>
        </button>
      </div>
    );
  }

  const propObj = typeof currentJob.property === "object" ? currentJob.property : null;
  const userObj = typeof currentJob.user === "object" ? currentJob.user : null;
  const providerObj = typeof currentJob.assignedProvider === "object" ? currentJob.assignedProvider : null;
  const invoiceObj = typeof currentJob.invoice === "object" ? currentJob.invoice : null;

  const propName = propObj?.name || propObj?.title || "Property";
  const propAddress = propObj?.address || "";
  const providerName = providerObj
    ? `${providerObj.firstName || ""} ${providerObj.lastName || ""}`.trim() ||
      providerObj.userName ||
      "Assigned Contractor"
    : "Unassigned";
  const providerPhone = providerObj?.phone || providerObj?.contactNumber || "N/A";
  const managerName = userObj
    ? `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || userObj.userName || "Property Manager"
    : "Property Manager";

  const createdDateStr = currentJob.createdAt
    ? new Date(currentJob.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recent";

  // Calculate progress percentage
  const progressPercent =
    currentJob.status === "Completed"
      ? 100
      : currentJob.status === "Pending Approval"
      ? 85
      : currentJob.status === "In Progress"
      ? 65
      : currentJob.status === "Accepted"
      ? 50
      : currentJob.status === "Assigned"
      ? 35
      : currentJob.status === "Pending"
      ? 15
      : 0;

  const isStep1Done = true;
  const isStep2Done = currentJob.status !== "Pending";
  const isStep3Done =
    currentJob.status === "Accepted" ||
    currentJob.status === "In Progress" ||
    currentJob.status === "Pending Approval" ||
    currentJob.status === "Completed";
  const isStep4Done = currentJob.status === "Pending Approval" || currentJob.status === "Completed";
  const isStep5Done = currentJob.status === "Completed";

  return (
    <div className="space-y-6">
      {/* Top Header Row with Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/service-requests")}
            className="p-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
            title="Back to Service Requests"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Project Progress: {currentJob.requestNo}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
              Real-time milestone tracking for {currentJob.issueTitle} at {propName}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`px-3.5 py-1.5 font-bold text-xs rounded-full border ${
              currentJob.status === "Completed"
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : currentJob.status === "In Progress" || currentJob.status === "Accepted"
                ? "bg-purple-100 text-[#6B1294] border-purple-200"
                : currentJob.status === "Assigned"
                ? "bg-blue-100 text-blue-800 border-blue-200"
                : currentJob.status === "Cancelled" || currentJob.status === "Rejected"
                ? "bg-red-100 text-red-800 border-red-200"
                : "bg-amber-100 text-amber-800 border-amber-200"
            }`}
          >
            Status: {currentJob.status}
          </span>

          {/* Cancel button if pending or assigned */}
          {(currentJob.status === "Pending" || currentJob.status === "Assigned") && (
            <button
              type="button"
              onClick={handleCancelRequest}
              disabled={isUpdating}
              className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-lg border border-red-200 transition-colors cursor-pointer"
            >
              Cancel Request
            </button>
          )}
        </div>
      </div>

      {/* Top Info Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Info Card (7 Cols) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#F2E7FC] text-[#6B1294] font-bold text-xs px-3 py-1 rounded-full">
              {currentJob.requestNo}
            </span>

            <span
              className={`font-semibold text-xs px-3 py-1 rounded-full ${
                currentJob.priority === "Urgent"
                  ? "bg-[#FEE2E2] text-[#EF4444]"
                  : currentJob.priority === "High"
                  ? "bg-amber-100 text-amber-700"
                  : currentJob.priority === "Medium"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {currentJob.priority} Priority
            </span>

            <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-3 py-1 rounded-full border border-emerald-200">
              Payout: ${currentJob.finalPayout || currentJob.basePayment || 0}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {currentJob.issueTitle}
            </h2>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{currentJob.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-normal border-t border-gray-100 pt-3">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>
                {propName} {propAddress ? `· ${propAddress}` : ""}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Created {createdDateStr}</span>
            </span>
            {currentJob.isOccupied && currentJob.tenantName && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>
                  Tenant: {currentJob.tenantName} {currentJob.tenantPhone ? `(${currentJob.tenantPhone})` : ""}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Right Contractor & Billing Card (5 Cols) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Assigned Service Provider
            </h3>
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">{providerName}</h4>
                <p className="text-xs text-gray-500 font-normal flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span>{providerPhone}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-gray-100 pt-3 text-xs">
            <div className="flex justify-between items-center text-gray-600">
              <span>Property Manager:</span>
              <span className="font-semibold text-gray-800">{managerName}</span>
            </div>
            {currentJob.eta && (
              <div className="flex justify-between items-center text-gray-600">
                <span>Estimated Schedule:</span>
                <span className="font-semibold text-gray-800">
                  {new Date(currentJob.eta).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-gray-900 font-bold border-t border-gray-100 pt-2">
              <span>Total Charge / Payout:</span>
              <span className="text-[#6B1294] text-sm">
                ${currentJob.finalPayout || currentJob.basePayment || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Progress Stepper Timeline Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Work Order Milestone Progress
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Status updates advance as the provider accepts and performs on-site work.
            </p>
          </div>

          <div className="bg-[#F4EFFC] border border-[#E1D4F4] px-4 py-2 rounded-full flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#6B1294] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#6B1294]">{progressPercent}% Complete</span>
          </div>
        </div>

        {/* 5-Step Horizontal Stepper Timeline */}
        <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-0 px-2 sm:px-4">
          <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-[3px] bg-gray-200 -z-0">
            <div
              className="h-full bg-[#6B1294] transition-all duration-500"
              style={{
                width: isStep5Done
                  ? "100%"
                  : isStep4Done
                  ? "75%"
                  : isStep3Done
                  ? "50%"
                  : isStep2Done
                  ? "25%"
                  : "0%",
              }}
            />
          </div>

          {/* Step 1: Received */}
          <div className="flex flex-col items-center text-center z-10 flex-1">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-xs">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </div>
            <h4 className="font-bold text-sm text-gray-900 mt-3">Received</h4>
            <p className="text-xs text-gray-400 font-normal mt-0.5">{createdDateStr}</p>
          </div>

          {/* Step 2: Assigned */}
          <div className="flex flex-col items-center text-center z-10 flex-1">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xs ${
                  isStep2Done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                <Truck className="w-5 h-5" />
              </div>
              {isStep2Done && (
                <div className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>
            <h4 className="font-bold text-sm text-gray-900 mt-3">Assigned</h4>
            <p className="text-xs text-gray-400 font-normal mt-0.5">{providerName}</p>
          </div>

          {/* Step 3: Accepted / On-Site */}
          <div className="flex flex-col items-center text-center z-10 flex-1">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xs ${
                  isStep3Done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                <Wrench className="w-5 h-5" />
              </div>
              {isStep3Done && (
                <div className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>
            <h4 className="font-bold text-sm text-gray-900 mt-3">Accepted / On-Site</h4>
            <p className="text-xs text-gray-400 font-normal mt-0.5">
              {currentJob.status === "In Progress"
                ? "Work in Progress"
                : currentJob.status === "Accepted"
                ? "Provider Accepted"
                : isStep3Done
                ? "Completed on-site"
                : "Awaiting Provider"}
            </p>
          </div>

          {/* Step 4: Review */}
          <div className="flex flex-col items-center text-center z-10 flex-1">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xs ${
                  isStep4Done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                <Check className="w-5 h-5 stroke-[2]" />
              </div>
              {isStep4Done && (
                <div className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>
            <h4 className="font-bold text-sm text-gray-900 mt-3">Review</h4>
            <p className="text-xs text-gray-400 font-normal mt-0.5">
              {currentJob.status === "Pending Approval"
                ? "Pending PM Verification"
                : isStep4Done
                ? "Reviewed & Approved"
                : "Awaiting Completion"}
            </p>
          </div>

          {/* Step 5: Completed */}
          <div className="flex flex-col items-center text-center z-10 flex-1">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xs ${
                  isStep5Done ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <h4 className="font-bold text-sm text-gray-900 mt-3">Completed</h4>
            <p className="text-xs text-gray-400 font-normal mt-0.5">
              {isStep5Done ? "Fully Finished" : "Final Stage"}
            </p>
          </div>
        </div>
      </div>

      {/* PENDING APPROVAL ACTION BANNER (When Provider finishes work and asks PM to approve) */}
      {currentJob.status === "Pending Approval" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-900">
                Action Required: Service Provider marked work as finished
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Please verify on-site completion and confirm to mark this work order as Completed.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmCompletion}
            disabled={isUpdating}
            className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-xs shrink-0"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Confirm & Complete Work</span>
          </button>
        </div>
      )}

      {/* ATTACHED PHOTOS & COMPLETION PHOTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Issue Photos */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#6B1294]" />
            <span>Issue Photos ({currentJob.images?.length || 0})</span>
          </h3>

          {currentJob.images && currentJob.images.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {currentJob.images.map((img, idx) => (
                <img
                  key={idx}
                  src={getPropertyImageUrl(img)}
                  alt={`Issue photo ${idx + 1}`}
                  onClick={() => setPreviewImage(getPropertyImageUrl(img))}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
              No photos attached to this request.
            </p>
          )}
        </div>

        {/* Completion Photos */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Completion Proof Photos ({currentJob.completionImages?.length || 0})</span>
          </h3>

          {currentJob.completionImages && currentJob.completionImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {currentJob.completionImages.map((img, idx) => (
                <img
                  key={idx}
                  src={getPropertyImageUrl(img)}
                  alt={`Completion photo ${idx + 1}`}
                  onClick={() => setPreviewImage(getPropertyImageUrl(img))}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
              Provider has not uploaded completion proof yet.
            </p>
          )}
        </div>
      </div>

      {/* INVOICE CARD (If Invoice generated) */}
      {invoiceObj ? (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Associated Invoice</span>
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                invoiceObj.status === "Paid"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {invoiceObj.status || "Pending Payment"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Invoice Number</span>
              <span className="font-bold text-gray-900 text-sm">{invoiceObj.invoiceNo}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Total Amount</span>
              <span className="font-bold text-gray-900 text-sm">${invoiceObj.totalAmount || 0}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Balance Due</span>
              <span className="font-bold text-gray-900 text-sm">${invoiceObj.balanceDue || 0}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Due Date</span>
              <span className="font-semibold text-gray-700">
                {invoiceObj.dueDate
                  ? new Date(invoiceObj.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push("/invoices")}
              className="text-xs font-semibold text-[#6B1294] hover:underline cursor-pointer"
            >
              View in All Invoices &rarr;
            </button>

            {invoiceObj.status !== "Paid" && (
              <button
                type="button"
                onClick={() => handlePayInvoice(invoiceObj._id)}
                disabled={isPayingInvoice}
                className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-xs shrink-0"
              >
                {isPayingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Pay Invoice via Stripe (${invoiceObj.balanceDue || invoiceObj.totalAmount || 0})</span>
              </button>
            )}
          </div>
        </div>
      ) : currentJob.status === "Completed" ? (
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-950">Maintenance Work Completed</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Generate the maintenance invoice and pay your assigned contractor securely via Stripe.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handlePayInvoice()}
            disabled={isPayingBySR}
            className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-xs shrink-0"
          >
            {isPayingBySR ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Pay Contractor (${currentJob.finalPayout || currentJob.basePayment || 0})</span>
          </button>
        </div>
      ) : null}

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <img
              src={previewImage}
              alt="Enlarged photo"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading tracking page...</div>}>
      <TrackContent />
    </Suspense>
  );
}
