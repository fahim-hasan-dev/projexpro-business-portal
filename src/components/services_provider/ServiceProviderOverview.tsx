"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wrench,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  MapPin,
  MoreHorizontal,
  Info,
  MessageSquare,
  ArrowLeftRight,
  X,
  Send,
  Check,
  Search,
  FileText,
  Shield,
  Loader2,
  RefreshCw,
  Play,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetAllServiceRequestsQuery,
  useUpdateServiceRequestStatusMutation,
} from "@/features/serviceRequest/serviceRequestApi";
import { useMyProfileQuery } from "@/features/profile/profileApi";
import { IServiceRequest } from "@/types/serviceRequest";

export default function ServiceProviderOverview(): React.ReactElement {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<"all" | "assigned" | "upcoming" | "completed" | "earnings">("all");

  // Modals state
  const [selectedJob, setSelectedJob] = useState<IServiceRequest | null>(null);
  const [progressModalJob, setProgressModalJob] = useState<IServiceRequest | null>(null);
  const [discussionJob, setDiscussionJob] = useState<IServiceRequest | null>(null);
  const [changeRequestJob, setChangeRequestJob] = useState<IServiceRequest | null>(null);
  const [reassignJob, setReassignJob] = useState<IServiceRequest | null>(null);

  // Form states for modals
  const [progressValue, setProgressValue] = useState<number>(50);
  const [progressNote, setProgressNote] = useState<string>("");
  const [selectedProgressStatus, setSelectedProgressStatus] = useState<"In Progress" | "Completed">("In Progress");

  const [discussionMessage, setDiscussionMessage] = useState<string>("");
  const [changeType, setChangeType] = useState<string>("Scope Adjustment");
  const [changeDetails, setChangeDetails] = useState<string>("");
  const [reassignReason, setReassignReason] = useState<string>("Schedule Conflict");
  const [reassignNotes, setReassignNotes] = useState<string>("");

  // Queries
  const { data: profileData } = useMyProfileQuery(undefined);
  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    isFetching: isRequestsFetching,
    refetch: refetchRequests,
  } = useGetAllServiceRequestsQuery();

  const [updateStatus, { isLoading: isUpdating }] = useUpdateServiceRequestStatusMutation();

  const user = profileData?.data || profileData?.user;
  const firstName = user?.firstName || "Provider";

  const rawRequests: IServiceRequest[] = useMemo(() => {
    if (!requestsData?.data) return [];
    if (Array.isArray(requestsData.data.requests)) {
      return requestsData.data.requests;
    }
    if (Array.isArray(requestsData.data)) {
      return requestsData.data;
    }
    return [];
  }, [requestsData]);

  // Statistics calculation
  const assignedCount = useMemo(() => {
    return rawRequests.filter(
      (r) => r.status === "Assigned" || r.status === "Accepted" || r.status === "In Progress"
    ).length;
  }, [rawRequests]);

  const upcomingCount = useMemo(() => {
    return rawRequests.filter((r) => r.status === "Assigned").length;
  }, [rawRequests]);

  const completedCount = useMemo(() => {
    return rawRequests.filter((r) => r.status === "Completed").length;
  }, [rawRequests]);

  const totalEarnings = useMemo(() => {
    return rawRequests
      .filter((r) => r.status === "Completed")
      .reduce((sum, r) => sum + (r.finalPayout ?? r.basePayment ?? 0), 0);
  }, [rawRequests]);

  const pendingApprovalCount = useMemo(() => {
    return rawRequests.filter((r) => r.status === "Pending Approval").length;
  }, [rawRequests]);

  // Top 4 stats definitions
  const stats = [
    {
      id: "assigned",
      tabKey: "assigned" as const,
      label: "ACTIVE WORK ORDERS",
      value: String(assignedCount),
      subtext: "Assigned & In Progress",
      icon: Wrench,
      iconBg: "bg-[#F0E6FC] text-[#8E25E3]",
      linkColor: "text-[#8E25E3]",
    },
    {
      id: "upcoming",
      tabKey: "upcoming" as const,
      label: "PENDING ACCEPTANCE",
      value: String(upcomingCount),
      subtext: "Awaiting your response",
      icon: Clock,
      iconBg: "bg-[#FEF3C7] text-[#D97706]",
      linkColor: "text-[#D97706]",
    },
    {
      id: "completed",
      tabKey: "completed" as const,
      label: "COMPLETED",
      value: String(completedCount),
      subtext: "Successfully finished jobs",
      icon: CheckCircle2,
      iconBg: "bg-[#DBEAFE] text-[#2563EB]",
      linkColor: "text-[#2563EB]",
    },
    {
      id: "earnings",
      tabKey: "earnings" as const,
      label: "TOTAL EARNINGS",
      value: `$ ${totalEarnings.toLocaleString()}`,
      subtext: `${pendingApprovalCount} Awaiting PM Approval`,
      icon: DollarSign,
      iconBg: "bg-[#D1FAE5] text-[#059669]",
      linkColor: "text-[#059669]",
    },
  ];

  // Filtering Logic for Tabs
  const filteredJobRequests = useMemo(() => {
    return rawRequests.filter((job) => {
      if (activeTabFilter === "all") return true;
      if (activeTabFilter === "assigned") {
        return job.status === "Assigned" || job.status === "Accepted" || job.status === "In Progress";
      }
      if (activeTabFilter === "upcoming") {
        return job.status === "Assigned";
      }
      if (activeTabFilter === "completed" || activeTabFilter === "earnings") {
        return job.status === "Completed";
      }
      return true;
    });
  }, [rawRequests, activeTabFilter]);

  // Handle Accept Job
  const handleAcceptJob = async (jobId: string) => {
    try {
      await updateStatus({
        id: jobId,
        data: { status: "Accepted" },
      }).unwrap();
      toast.success("Work Order accepted! You can now start work.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to accept job");
    }
  };

  // Handle Start Job
  const handleStartJob = async (jobId: string) => {
    try {
      await updateStatus({
        id: jobId,
        data: { status: "In Progress" },
      }).unwrap();
      toast.success("Job started! Status changed to In Progress.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to start job");
    }
  };

  // Handle Save Progress / Completion
  const handleSaveProgress = async () => {
    if (!progressModalJob) return;

    try {
      const nextStatus = selectedProgressStatus === "Completed" ? "Pending Approval" : "In Progress";
      await updateStatus({
        id: progressModalJob._id,
        data: {
          status: nextStatus,
          note: progressNote.trim() || undefined,
        },
      }).unwrap();

      if (selectedProgressStatus === "Completed") {
        toast.success("Work submitted for Property Manager review & approval!");
      } else {
        toast.success("Progress note updated successfully.");
      }

      setProgressModalJob(null);
      setProgressNote("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update progress");
    }
  };

  // Handle Discussion
  const handleSendDiscussion = () => {
    if (!discussionJob || !discussionMessage.trim()) return;
    toast.success("Inquiry sent to Property Manager.");
    setDiscussionJob(null);
    setDiscussionMessage("");
  };

  // Handle Change Request
  const handleSendChangeRequest = () => {
    if (!changeRequestJob || !changeDetails.trim()) return;
    toast.success(`Change request for ${changeRequestJob.requestNo} submitted.`);
    setChangeRequestJob(null);
    setChangeDetails("");
  };

  // Handle Reassignment Request (Decline / Reject)
  const handleSendReassignment = async () => {
    if (!reassignJob) return;
    try {
      await updateStatus({
        id: reassignJob._id,
        data: {
          status: "Rejected",
          reason: `${reassignReason}${reassignNotes ? `: ${reassignNotes}` : ""}`,
        },
      }).unwrap();

      toast.success("Job declined & reassignment requested to Super Admin.");
      setReassignJob(null);
      setReassignNotes("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to request reassignment");
    }
  };

  const getPropertyName = (property: any) => {
    if (!property) return "Property";
    if (typeof property === "string") return property;
    return property.title || property.name || "Property";
  };

  const getPMName = (u: any) => {
    if (!u) return "Property Manager";
    if (typeof u === "string") return "Property Manager";
    const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return name || u.userName || u.email || "Property Manager";
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Assigned":
        return "bg-amber-100 text-amber-800 border border-amber-200/80";
      case "Accepted":
        return "bg-blue-100 text-blue-800 border border-blue-200/80";
      case "In Progress":
        return "bg-indigo-100 text-indigo-800 border border-indigo-200/80";
      case "Pending Approval":
        return "bg-purple-100 text-[#6B1294] border border-purple-200/80";
      case "Completed":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200/80";
      case "Rejected":
      case "Declined":
        return "bg-red-100 text-red-800 border border-red-200/80";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200/80";
    }
  };

  return (
    <div className="space-y-6">
      {/* Click outside listener for 3-dots dropdown */}
      {activeMenuId && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setActiveMenuId(null)}
        />
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
            Hi, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-700 font-medium mt-1">
            Your <span className="font-semibold text-[#8E25E3]">ProjexPro</span> dashboard shows you have{" "}
            <span className="font-bold text-[#8E25E3]">{assignedCount}</span> active work order{assignedCount === 1 ? "" : "s"}.
          </p>
          <p className="text-xs sm:text-sm text-gray-400 font-normal mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetchRequests()}
          disabled={isRequestsFetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRequestsFetching ? "animate-spin text-[#6B1294]" : "text-gray-500"}`} />
          <span>{isRequestsFetching ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Top 4 Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => {
          const IconComp = stat.icon;
          const isSelected = activeTabFilter === stat.tabKey;
          return (
            <div
              key={stat.id}
              onClick={() => setActiveTabFilter(isSelected ? "all" : stat.tabKey)}
              className={`bg-[#FFFFFF] border rounded-xl p-5 flex flex-col justify-between shadow-2xs transition-all cursor-pointer group relative ${
                isSelected
                  ? "border-[#8E25E3] ring-2 ring-[#8E25E3]/30 bg-purple-50/20"
                  : "border-[#E5E7EB] hover:shadow-md hover:border-[#8E25E3]/40"
              }`}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-3 text-[10px] font-bold uppercase tracking-wider text-[#8E25E3] bg-[#F0E6FC] px-2 py-0.5 rounded-full border border-[#8E25E3]/20">
                  Selected Filter
                </span>
              )}
              <div>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.iconBg} group-hover:scale-105 transition-transform`}
                  >
                    <IconComp className="w-4.5 h-4.5" />
                  </div>
                  <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {stat.label}
                  </h2>
                </div>

                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-gray-900 tracking-tight block">
                    {stat.value}
                  </span>
                  <p className="text-xs font-medium text-gray-500 mt-1">
                    {stat.subtext}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span
                  className={`text-xs font-semibold underline decoration-solid underline-offset-2 ${stat.linkColor} group-hover:opacity-80 transition-opacity`}
                >
                  Click for Details
                </span>
                <ArrowRight className={`w-3.5 h-3.5 ${stat.linkColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Main Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column: Action Center */}
        <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 flex flex-col shadow-2xs min-h-[600px]">
          <div className="shrink-0 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-[#6B1294] tracking-wide uppercase">
              ACTION CENTER
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 max-h-[640px]">
            {/* Card 1: Assigned Jobs */}
            <div className="bg-[#FFFFFF] border border-gray-200/90 rounded-2xl p-4 sm:p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#F0E6FC] flex items-center justify-center shrink-0 mt-0.5">
                  <Search className="w-5 h-5 text-[#6B1294]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                    {upcomingCount} Pending Work Orders
                  </h3>
                  <p className="text-xs text-gray-500 font-normal mt-1 leading-snug">
                    Review and accept jobs assigned to you
                  </p>
                </div>
              </div>
              <div className="mt-3.5">
                <Link
                  href="/services_provider/job_request"
                  className="w-full bg-[#6B1294] hover:bg-[#580e7d] text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-2xs block text-center transition-all active:scale-[0.99]"
                >
                  View Job Requests
                </Link>
              </div>
            </div>

            {/* Card 2: Jobs In Progress */}
            <div className="bg-[#FFFFFF] border border-gray-200/90 rounded-2xl p-4 sm:p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#F0E6FC] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-[#6B1294]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                    {assignedCount} Active Work Orders
                  </h3>
                  <p className="text-xs text-gray-500 font-normal mt-1 leading-snug">
                    Update status or submit finished repairs
                  </p>
                </div>
              </div>
              <div className="mt-3.5">
                <Link
                  href="/services_provider/job_request"
                  className="w-full bg-[#6B1294] hover:bg-[#580e7d] text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-2xs block text-center transition-all active:scale-[0.99]"
                >
                  Manage Active Jobs
                </Link>
              </div>
            </div>

            {/* Card 3: Payouts */}
            <div className="bg-[#FFFFFF] border border-gray-200/90 rounded-2xl p-4 sm:p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#F0E6FC] flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5 text-[#6B1294]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                    ${totalEarnings.toFixed(2)} Total Earnings
                  </h3>
                  <p className="text-xs text-gray-500 font-normal mt-1 leading-snug">
                    Track contractor invoices and completed payments
                  </p>
                </div>
              </div>
              <div className="mt-3.5">
                <Link
                  href="/services_provider/payment"
                  className="w-full bg-[#6B1294] hover:bg-[#580e7d] text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-2xs block text-center transition-all active:scale-[0.99]"
                >
                  Review Earnings & Invoices
                </Link>
              </div>
            </div>

            {/* Card 4: Profile & Documents */}
            <div className="bg-[#FFFFFF] border border-gray-200/90 rounded-2xl p-4 sm:p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#F0E6FC] flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-5 h-5 text-[#6B1294]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                    Business Profile & Licenses
                  </h3>
                  <p className="text-xs text-gray-500 font-normal mt-1 leading-snug">
                    Keep your license and insurance documents updated
                  </p>
                </div>
              </div>
              <div className="mt-3.5">
                <Link
                  href="/services_provider/profile"
                  className="w-full bg-[#6B1294] hover:bg-[#580e7d] text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-2xs block text-center transition-all active:scale-[0.99]"
                >
                  Update Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Work Order Section */}
        <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 flex flex-col shadow-2xs min-h-[600px]">
          {/* Header & Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {activeTabFilter === "all" && "All Work Orders"}
                {activeTabFilter === "assigned" && "Active Work Orders"}
                {activeTabFilter === "upcoming" && "Pending Acceptance"}
                {activeTabFilter === "completed" && "Completed Work Orders"}
                {activeTabFilter === "earnings" && "Paid / Earned Work Orders"}
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {filteredJobRequests.length}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveTabFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTabFilter === "all"
                    ? "bg-[#8E25E3] text-white shadow-2xs"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter("assigned")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTabFilter === "assigned"
                    ? "bg-[#8E25E3] text-white shadow-2xs"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Active ({assignedCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter("upcoming")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTabFilter === "upcoming"
                    ? "bg-[#8E25E3] text-white shadow-2xs"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Pending ({upcomingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabFilter("completed")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTabFilter === "completed"
                    ? "bg-[#8E25E3] text-white shadow-2xs"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>
          </div>

          {/* Filter Notice Banner if specific tab active */}
          {activeTabFilter !== "all" && (
            <div className="mb-3.5 px-3.5 py-2 bg-purple-50 border border-purple-200/80 rounded-xl text-xs text-[#8E25E3] flex items-center justify-between">
              <span>
                Showing only work orders for: <strong className="uppercase">{activeTabFilter}</strong>
              </span>
              <button
                type="button"
                onClick={() => setActiveTabFilter("all")}
                className="underline hover:text-purple-900 font-medium cursor-pointer"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Job Request Items List */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 max-h-[580px]">
            {isRequestsLoading ? (
              <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#6B1294]" />
                <span className="text-sm font-medium">Loading work orders...</span>
              </div>
            ) : filteredJobRequests.length === 0 ? (
              <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm font-medium">No work orders match this tab category.</p>
                <button
                  type="button"
                  onClick={() => setActiveTabFilter("all")}
                  className="mt-2 text-xs font-bold text-[#8E25E3] underline cursor-pointer"
                >
                  View all work orders
                </button>
              </div>
            ) : (
              filteredJobRequests.map((req) => {
                const propertyName = getPropertyName(req.property);
                const payout = req.finalPayout ?? req.basePayment ?? 0;

                return (
                  <div
                    key={req._id}
                    className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-gray-300 hover:shadow-2xs relative"
                  >
                    {/* Left Side: Job Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 tracking-wider">
                          {req.requestNo || req._id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-red-600">
                          {req.priority}
                        </span>
                        <span className="text-xs font-bold text-gray-800">
                          ${payout.toFixed(2)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 leading-tight truncate">
                        {propertyName}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-normal">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{req.issueTitle}</span>
                      </div>

                      {/* Status Badge */}
                      <div className="pt-1">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full inline-block ${getStatusBadgeStyle(req.status)}`}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {/* Right Side: Action Buttons */}
                    <div className="flex items-start gap-1.5 shrink-0 self-end sm:self-center">
                      <div className="flex flex-col gap-1.5 w-32 sm:w-36">
                        {req.status === "Assigned" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleAcceptJob(req._id)}
                            className="w-full py-2 px-3 text-xs font-bold text-white bg-[#6B1294] hover:bg-[#580e7d] rounded-lg transition-all shadow-2xs cursor-pointer text-center active:scale-95 whitespace-nowrap h-8 flex items-center justify-center"
                          >
                            Accept Job
                          </button>
                        )}

                        {req.status === "Accepted" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleStartJob(req._id)}
                            className="w-full py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-2xs cursor-pointer text-center active:scale-95 whitespace-nowrap h-8 flex items-center justify-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start Work</span>
                          </button>
                        )}

                        {req.status === "In Progress" && (
                          <button
                            type="button"
                            onClick={() => {
                              setProgressModalJob(req);
                              setProgressValue(50);
                              setSelectedProgressStatus("In Progress");
                            }}
                            className="w-full py-2 px-3 text-xs font-bold text-white bg-[#6B1294] hover:bg-[#580e7d] rounded-lg transition-all shadow-2xs cursor-pointer text-center active:scale-95 whitespace-nowrap h-8 flex items-center justify-center"
                          >
                            Update Progress
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedJob(req)}
                          className="w-full py-2 px-3 text-xs font-bold text-[#6B1294] bg-white hover:bg-purple-50/60 border border-[#6B1294]/40 rounded-lg transition-all cursor-pointer text-center active:scale-95 whitespace-nowrap h-8 flex items-center justify-center"
                        >
                          Open Job
                        </button>
                      </div>

                      {/* Three Dots Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(activeMenuId === req._id ? null : req._id)
                          }
                          className="px-2.5 h-8 bg-[#E2E2E5] hover:bg-gray-300 text-gray-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Popup Menu */}
                        {activeMenuId === req._id && (
                          <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                            {/* 1. View Work Order Details */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedJob(req);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors text-left cursor-pointer"
                            >
                              <Info className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>View Work Order Details</span>
                            </button>

                            {/* 2. Discuss This Work Order */}
                            <button
                              type="button"
                              onClick={() => {
                                setDiscussionJob(req);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors text-left cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
                              <span>Discuss This Work Order</span>
                            </button>

                            {/* 3. Submit Change Request */}
                            <button
                              type="button"
                              onClick={() => {
                                setChangeRequestJob(req);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors text-left cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Submit Change Request</span>
                            </button>

                            {/* 4. Request To Reassign / Decline */}
                            <button
                              type="button"
                              onClick={() => {
                                setReassignJob(req);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors text-left cursor-pointer"
                            >
                              <ArrowLeftRight className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Decline / Reassign</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 1. VIEW WORK ORDER DETAILS MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] rounded-xl p-6 sm:p-7 sm:max-w-2xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-4 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 tracking-wider block">
                  {selectedJob.requestNo || selectedJob._id}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                  {getPropertyName(selectedJob.property)}
                </h2>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  Posted By: {getPMName(selectedJob.user)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusBadgeStyle(selectedJob.status)}`}>
                {selectedJob.status}
              </span>
              <span className="text-xs font-bold text-red-600">
                Priority: {selectedJob.priority}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
                <span className="text-xs text-gray-400 font-normal block">Issue Title</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block truncate">
                  {selectedJob.issueTitle}
                </span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
                <span className="text-xs text-gray-400 font-normal block">Total Payout</span>
                <span className="text-sm font-bold text-gray-900 mt-1 block">
                  ${(selectedJob.finalPayout ?? selectedJob.basePayment ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5">
              <span className="text-xs text-gray-400 font-normal block">Scope of Work & Description</span>
              <p className="text-xs text-gray-800 font-normal mt-1 leading-relaxed">
                {selectedJob.description || selectedJob.issueTitle}
              </p>
            </div>

            {selectedJob.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 text-xs text-red-800">
                <strong>Decline Reason:</strong> {selectedJob.rejectionReason}
              </div>
            )}

            <div className="flex items-center gap-3 pt-3">
              {selectedJob.status === "Assigned" && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    handleAcceptJob(selectedJob._id);
                    setSelectedJob(null);
                  }}
                  className="flex-1 bg-[#6B1294] hover:bg-[#580e7d] text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Accept Work Order
                </button>
              )}
              {selectedJob.status === "Accepted" && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    handleStartJob(selectedJob._id);
                    setSelectedJob(null);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Start Work Order
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. UPDATE PROGRESS MODAL */}
      {progressModalJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] rounded-xl p-6 sm:p-7 sm:max-w-lg w-full shadow-2xl relative space-y-4 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-[#6B1294] tracking-wider block">
                  Update Work Progress
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                  {getPropertyName(progressModalJob.property)} ({progressModalJob.requestNo})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setProgressModalJob(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Work Status
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedProgressStatus("In Progress")}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    selectedProgressStatus === "In Progress"
                      ? "bg-blue-50 border-blue-500 text-blue-800"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProgressStatus("Completed");
                    setProgressValue(100);
                  }}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    selectedProgressStatus === "Completed"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Submit for PM Approval
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Progress Notes & Updates
              </label>
              <textarea
                rows={3}
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder="Describe current status, tasks completed, or required next steps..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#6B1294] outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveProgress}
                className="flex-1 bg-[#6B1294] hover:bg-[#580e7d] text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Progress</span>
              </button>
              <button
                type="button"
                onClick={() => setProgressModalJob(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DISCUSS THIS WORK ORDER MODAL */}
      {discussionJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] rounded-xl p-6 sm:p-7 sm:max-w-lg w-full shadow-2xl relative space-y-4 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-[#6B1294] tracking-wider block">
                  Discuss This Work Order
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                  {getPropertyName(discussionJob.property)} ({discussionJob.requestNo})
                </h2>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  To: {getPMName(discussionJob.user)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDiscussionJob(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Message / Inquiry
              </label>
              <textarea
                rows={4}
                value={discussionMessage}
                onChange={(e) => setDiscussionMessage(e.target.value)}
                placeholder="Ask clarifying questions regarding access, materials, or scope..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#6B1294] outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendDiscussion}
                className="flex-1 bg-[#6B1294] hover:bg-[#580e7d] text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
              <button
                type="button"
                onClick={() => setDiscussionJob(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBMIT CHANGE REQUEST MODAL */}
      {changeRequestJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] rounded-xl p-6 sm:p-7 sm:max-w-lg w-full shadow-2xl relative space-y-4 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 tracking-wider block">
                  Submit Change Request
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                  {getPropertyName(changeRequestJob.property)} ({changeRequestJob.requestNo})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setChangeRequestJob(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Change Type
              </label>
              <select
                value={changeType}
                onChange={(e) => setChangeType(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:bg-white focus:border-[#6B1294] outline-none"
              >
                <option value="Scope Adjustment">Scope Adjustment</option>
                <option value="Timeline Extension">Timeline Extension</option>
                <option value="Material Cost Adjustment">Material Cost Adjustment</option>
                <option value="Specialized Equipment Request">Specialized Equipment Request</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Change Details & Justification
              </label>
              <textarea
                rows={3}
                value={changeDetails}
                onChange={(e) => setChangeDetails(e.target.value)}
                placeholder="Describe the requested changes and rationale..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#6B1294] outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendChangeRequest}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Submit Change Request
              </button>
              <button
                type="button"
                onClick={() => setChangeRequestJob(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. REQUEST TO REASSIGN / DECLINE MODAL */}
      {reassignJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] rounded-xl p-6 sm:p-7 sm:max-w-lg w-full shadow-2xl relative space-y-4 border border-[#E5E7EB]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-amber-600 tracking-wider block">
                  Decline & Request Reassignment
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                  {getPropertyName(reassignJob.property)} ({reassignJob.requestNo})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setReassignJob(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Reason for Reassignment Request
              </label>
              <select
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:bg-white focus:border-[#6B1294] outline-none"
              >
                <option value="Schedule Conflict">Schedule Conflict</option>
                <option value="Out of Skill Scope">Out of Skill Scope</option>
                <option value="Specialized Equipment Required">Specialized Equipment Required</option>
                <option value="Distance / Location Issues">Distance / Location Issues</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Additional Context
              </label>
              <textarea
                rows={3}
                value={reassignNotes}
                onChange={(e) => setReassignNotes(e.target.value)}
                placeholder="Explain why this job should be reassigned..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#6B1294] outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSendReassignment}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Submit Reassignment</span>
              </button>
              <button
                type="button"
                onClick={() => setReassignJob(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
