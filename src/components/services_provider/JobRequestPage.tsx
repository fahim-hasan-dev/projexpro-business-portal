"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Eye,
  X,
  MapPin,
  Play,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  User,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
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
import {
  useGetAllServiceRequestsQuery,
  useUpdateServiceRequestStatusMutation,
} from "@/features/serviceRequest/serviceRequestApi";
import { IServiceRequest } from "@/types/serviceRequest";
import DeclineJobModal from "./DeclineJobModal";

export default function JobRequestPage(): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedJob, setSelectedJob] = useState<IServiceRequest | null>(null);

  // Completion modal state for In Progress -> Pending Approval
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const [completionFilePreviews, setCompletionFilePreviews] = useState<string[]>([]);

  // Modals
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineJobTargetId, setDeclineJobTargetId] = useState("");

  // RTK Query: fetch service requests assigned to the logged-in service provider
  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllServiceRequestsQuery({
    searchTerm: searchTerm.trim() || undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
  });

  const [updateStatus, { isLoading: isUpdating }] = useUpdateServiceRequestStatusMutation();

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

  // Keep selectedJob synced when query data updates
  const currentSelectedJob = useMemo(() => {
    if (!selectedJob) return null;
    return requests.find((r) => r._id === selectedJob._id) || selectedJob;
  }, [requests, selectedJob]);

  // Handle Accept Job (Assigned -> Accepted)
  const handleAcceptJob = async (jobId: string) => {
    try {
      await updateStatus({
        id: jobId,
        data: { status: "Accepted" },
      }).unwrap();
      toast.success("Job accepted successfully! You can start work whenever ready.");
      setSelectedJob(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to accept job");
    }
  };

  // Handle Decline Job (Assigned -> Rejected)
  const handleOpenDeclineModal = (jobId: string) => {
    setDeclineJobTargetId(jobId);
    setDeclineModalOpen(true);
  };

  const handleSubmitDeclineReason = async (reason: string) => {
    try {
      await updateStatus({
        id: declineJobTargetId,
        data: { status: "Rejected", reason },
      }).unwrap();
      toast.error("Job declined. Returned to Super Admin for reassignment.");
      setDeclineModalOpen(false);
      setSelectedJob(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to decline job");
    }
  };

  // Handle Start Job (Accepted -> In Progress)
  const handleStartJob = async (jobId: string) => {
    try {
      await updateStatus({
        id: jobId,
        data: { status: "In Progress" },
      }).unwrap();
      toast.success("Job started! Status changed to In Progress.");
      setSelectedJob(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to start job");
    }
  };

  // Handle Open Completion Modal
  const handleOpenCompletionModal = (job: IServiceRequest) => {
    setSelectedJob(job);
    setCompletionNote("");
    setCompletionFiles([]);
    setCompletionFilePreviews([]);
    setCompletionModalOpen(true);
  };

  // Handle File Selection for Completion
  const handleCompletionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setCompletionFiles((prev) => [...prev, ...newFiles]);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setCompletionFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveCompletionFile = (index: number) => {
    setCompletionFiles((prev) => prev.filter((_, i) => i !== index));
    setCompletionFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Submit Completion (In Progress -> Pending Approval)
  const handleSubmitCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedJob) return;

    try {
      if (completionFiles.length > 0) {
        const formData = new FormData();
        formData.append("data", JSON.stringify({
          status: "Pending Approval",
          note: completionNote.trim() || undefined,
        }));
        completionFiles.forEach((file) => {
          formData.append("images", file);
        });
        await updateStatus({
          id: currentSelectedJob._id,
          data: formData,
        }).unwrap();
      } else {
        await updateStatus({
          id: currentSelectedJob._id,
          data: {
            status: "Pending Approval",
            note: completionNote.trim() || undefined,
          },
        }).unwrap();
      }

      toast.success("Work submitted for Property Manager approval!");
      setCompletionModalOpen(false);
      setSelectedJob(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit completion");
    }
  };

  // Helper for Priority Badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
      case "High":
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {priority}
          </span>
        );
      case "Medium":
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Medium
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Low
          </span>
        );
    }
  };

  // Helper for Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Assigned":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Pending Acceptance
          </span>
        );
      case "Accepted":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            Accepted
          </span>
        );
      case "In Progress":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
            In Progress
          </span>
        );
      case "Pending Approval":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-[#6B1294] border border-purple-200">
            Awaiting Approval
          </span>
        );
      case "Completed":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Completed
          </span>
        );
      case "Rejected":
      case "Declined":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">
            Declined
          </span>
        );
      case "Cancelled":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const getPropertyName = (property: any) => {
    if (!property) return "Property";
    if (typeof property === "string") return property;
    return property.title || property.name || "Property";
  };

  const getPropertyAddress = (property: any) => {
    if (!property || typeof property === "string") return "";
    return property.address || "";
  };

  const getPMName = (user: any) => {
    if (!user) return "Property Manager";
    if (typeof user === "string") return "Property Manager";
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return name || user.userName || user.email || "Property Manager";
  };

  const getPMEmail = (user: any) => {
    if (!user || typeof user === "string") return "";
    return user.email || "";
  };

  const getPMPhone = (user: any) => {
    if (!user || typeof user === "string") return "";
    return user.phone || user.contactNumber || "";
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Job Requests & Work Orders
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5 sm:mt-1">
            Review assigned requests, accept/decline jobs, and submit work completion for Property Manager approval.
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

      {/* Top Search & Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, property, service..."
            className="w-full bg-gray-100/80 border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#8E25E3] transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 bg-gray-100/80 py-5 border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:ring-0 focus:border-[#8E25E3]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Assigned">Pending Acceptance</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Pending Approval">Awaiting Approval</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Rejected">Declined</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-gray-500 font-medium ml-1">
            {requests.length} results
          </span>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-5 sm:px-6">Job ID</th>
                <th className="py-4 px-5 sm:px-6">Property & PM</th>
                <th className="py-4 px-5 sm:px-6">Service Request</th>
                <th className="py-4 px-5 sm:px-6">Priority</th>
                <th className="py-4 px-5 sm:px-6">Payout</th>
                <th className="py-4 px-5 sm:px-6">Status</th>
                <th className="py-4 px-5 sm:px-6 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#6B1294]" />
                      <span>Loading assigned jobs...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length > 0 ? (
                requests.map((job) => {
                  const propertyName = getPropertyName(job.property);
                  const pmName = getPMName(job.user);
                  const payout = job.finalPayout ?? job.basePayment ?? 0;

                  return (
                    <tr key={job._id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-4 px-5 sm:px-6 text-sm font-bold text-[#8E25E3] whitespace-nowrap">
                        {job.requestNo || job._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-4 px-5 sm:px-6">
                        <div className="text-sm font-bold text-gray-900 leading-tight">
                          {propertyName}
                        </div>
                        <div className="text-xs text-gray-400 font-normal mt-0.5">
                          PM: {pmName}
                        </div>
                      </td>
                      <td className="py-4 px-5 sm:px-6 text-sm font-medium text-gray-700">
                        {job.issueTitle}
                      </td>
                      <td className="py-4 px-5 sm:px-6 whitespace-nowrap">
                        {getPriorityBadge(job.priority)}
                      </td>
                      <td className="py-4 px-5 sm:px-6 text-sm font-bold text-gray-900 whitespace-nowrap">
                        ${payout.toFixed(2)}
                      </td>
                      <td className="py-4 px-5 sm:px-6 whitespace-nowrap">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="py-4 px-5 sm:px-6 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedJob(job)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#6B1294] bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-500 font-normal">
                    No job requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JOB DETAILS MODAL */}
      {currentSelectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-7 sm:max-w-2xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-4 border border-[#E5E7EB] custom-scrollbar animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-bold text-purple-700 tracking-wider block">
                  Job #{currentSelectedJob.requestNo || currentSelectedJob._id}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                  {getPropertyName(currentSelectedJob.property)}
                </h2>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  Property Manager: <span className="font-semibold text-gray-800">{getPMName(currentSelectedJob.user)}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & ETA */}
            <div className="flex items-center justify-between">
              {getStatusBadge(currentSelectedJob.status)}
              {currentSelectedJob.eta && (
                <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  ETA: {new Date(currentSelectedJob.eta).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Grid 1: Job Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Issue Title</span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block truncate">
                  {currentSelectedJob.issueTitle}
                </span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Priority Level</span>
                <div className="mt-1">{getPriorityBadge(currentSelectedJob.priority)}</div>
              </div>
            </div>

            {/* Grid 2: Payout Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Base Payout</span>
                <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                  ${(currentSelectedJob.basePayment || 0).toFixed(2)}
                </span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Specialized Rate</span>
                <span className="text-xs font-bold text-gray-900 mt-0.5 block">
                  {currentSelectedJob.specializedRate?.isActive
                    ? currentSelectedJob.specializedRate.paymentType === "Percentage"
                      ? `+${currentSelectedJob.specializedRate.value}%`
                      : `+$${currentSelectedJob.specializedRate.value}`
                    : "None"}
                </span>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-[#6B1294] uppercase">Total Payout</span>
                <span className="text-base font-bold text-[#6B1294] mt-0.5 block">
                  ${(currentSelectedJob.finalPayout ?? currentSelectedJob.basePayment ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Job Site Address */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Job Site Address</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mt-1">
                <MapPin className="w-4 h-4 text-[#6B1294] shrink-0" />
                <span>
                  {getPropertyAddress(currentSelectedJob.property) || "Address not provided"}
                  {currentSelectedJob.locationDetails ? ` — ${currentSelectedJob.locationDetails}` : ""}
                </span>
              </div>
            </div>

            {/* Property Manager Contact Details */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Property Manager Contact
              </span>
              <div className="flex flex-wrap items-center gap-4 text-gray-700 font-medium">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {getPMName(currentSelectedJob.user)}
                </span>
                {getPMEmail(currentSelectedJob.user) && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {getPMEmail(currentSelectedJob.user)}
                  </span>
                )}
                {getPMPhone(currentSelectedJob.user) && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {getPMPhone(currentSelectedJob.user)}
                  </span>
                )}
              </div>
            </div>

            {/* Tenant Info if Occupied */}
            {currentSelectedJob.isOccupied && (
              <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">
                  Occupied Unit — Tenant Details
                </span>
                <div className="flex items-center gap-3">
                  <span>Name: <strong>{currentSelectedJob.tenantName || "N/A"}</strong></span>
                  {currentSelectedJob.tenantPhone && (
                    <span>Phone: <strong>{currentSelectedJob.tenantPhone}</strong></span>
                  )}
                </div>
              </div>
            )}

            {/* Main Issue / Description */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Job Description & Scope</span>
              <p className="text-xs text-gray-800 font-normal mt-1 leading-relaxed whitespace-pre-wrap">
                {currentSelectedJob.description || currentSelectedJob.issueTitle}
              </p>
            </div>

            {/* Photos attached to request */}
            {currentSelectedJob.images && currentSelectedJob.images.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">
                  Request Photos ({currentSelectedJob.images.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentSelectedJob.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
                    >
                      <img src={img} alt={`Job Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Decline Reason Banner if previously declined */}
            {currentSelectedJob.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Decline Reason Recorded:</span>
                </div>
                <p className="font-normal">{currentSelectedJob.rejectionReason}</p>
              </div>
            )}

            {/* Completion Note & Images if submitted */}
            {currentSelectedJob.note && (
              <div className="bg-purple-50/60 border border-purple-200 rounded-lg p-3 text-xs text-purple-900 space-y-1">
                <span className="text-[10px] font-bold text-[#6B1294] uppercase block">
                  Completion Note
                </span>
                <p>{currentSelectedJob.note}</p>
              </div>
            )}

            {currentSelectedJob.completionImages && currentSelectedJob.completionImages.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">
                  Completed Work Photos
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentSelectedJob.completionImages.map((img, idx) => (
                    <a
                      key={idx}
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90"
                    >
                      <img src={img} alt={`Completion Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons based on status */}
            {currentSelectedJob.status === "Assigned" && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleAcceptJob(currentSelectedJob._id)}
                  className="flex-1 bg-[#6B1294] hover:bg-[#580e7a] disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer text-center shadow-xs flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Accept Job</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleOpenDeclineModal(currentSelectedJob._id)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer text-center border border-red-200"
                >
                  Decline Job
                </button>
              </div>
            )}

            {currentSelectedJob.status === "Accepted" && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStartJob(currentSelectedJob._id)}
                  className="w-full bg-[#6B1294] hover:bg-[#580e7a] disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer text-center shadow-xs flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>Start Work (Mark In Progress)</span>
                </button>
              </div>
            )}

            {currentSelectedJob.status === "In Progress" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenCompletionModal(currentSelectedJob)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer text-center shadow-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finish Work & Submit for Approval</span>
                </button>
              </div>
            )}

            {currentSelectedJob.status === "Pending Approval" && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3.5 text-center text-xs font-semibold text-[#6B1294]">
                Work has been submitted and is currently awaiting Property Manager review & approval.
              </div>
            )}

            {currentSelectedJob.status === "Completed" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Job completed and approved! Invoice generated.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decline Modal */}
      <DeclineJobModal
        isOpen={declineModalOpen}
        jobId={declineJobTargetId}
        onClose={() => setDeclineModalOpen(false)}
        onSubmitDecline={handleSubmitDeclineReason}
        isLoading={isUpdating}
      />

      {/* Completion Modal */}
      {completionModalOpen && currentSelectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative border border-gray-200 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Complete Work & Request Approval
                  </h2>
                  <p className="text-xs text-gray-500 font-normal">
                    Job #{currentSelectedJob.requestNo} — {getPropertyName(currentSelectedJob.property)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCompletionModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitCompletion} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Completion Note / Summary of Work
                </label>
                <textarea
                  rows={3}
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="Describe the completed repairs or actions taken..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Attach Completed Work Photos (Optional)
                </label>
                <label className="border-2 border-dashed border-gray-300 hover:border-[#6B1294] bg-gray-50/50 rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors block">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleCompletionFileChange}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-700">Click to upload photos</span>
                  <span className="text-[10px] text-gray-400">JPG, PNG (max 10 MB each)</span>
                </label>

                {/* Previews */}
                {completionFilePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {completionFilePreviews.map((src, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 h-16">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveCompletionFile(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-800 leading-relaxed">
                Once submitted, the Property Manager will be notified to review the completed repairs and approve for final invoice payout.
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletionModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs cursor-pointer border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Submit for Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
