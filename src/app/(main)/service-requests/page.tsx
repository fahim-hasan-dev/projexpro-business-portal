"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { ServiceRequest, StatusType, PriorityType, IServiceRequest } from "@/types/serviceRequest";
import ServiceRequestHeader from "@/components/service-requests/ServiceRequestHeader";
import ServiceRequestStats from "@/components/service-requests/ServiceRequestStats";
import ServiceRequestTable from "@/components/service-requests/ServiceRequestTable";
import CreateServiceRequestModal from "@/components/service-requests/CreateServiceRequestModal";
import { useGetAllServiceRequestsQuery } from "@/features/serviceRequest/serviceRequestApi";

export default function ServiceRequestsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch live service requests from backend
  const {
    data: serviceRequestsRes,
    isLoading: isRequestsLoading,
    refetch,
  } = useGetAllServiceRequestsQuery({
    searchTerm: searchTerm.trim() || undefined,
  });

  const rawRequests: IServiceRequest[] = useMemo(() => {
    return serviceRequestsRes?.data?.requests || [];
  }, [serviceRequestsRes]);

  // Map backend IServiceRequest to ServiceRequest interface for the table
  const mappedRequests: ServiceRequest[] = useMemo(() => {
    return rawRequests.map((r) => {
      const propObj = typeof r.property === "object" ? r.property : null;
      const providerObj = typeof r.assignedProvider === "object" ? r.assignedProvider : null;
      const providerName = providerObj
        ? `${providerObj.firstName || ""} ${providerObj.lastName || ""}`.trim() ||
          providerObj.userName ||
          "Assigned Provider"
        : "Unassigned";

      const createdDateStr = r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Recent";

      const scheduledDateStr = r.eta
        ? new Date(r.eta).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : createdDateStr;

      return {
        _id: r._id,
        id: r.requestNo || r._id.slice(-6).toUpperCase(),
        title: r.issueTitle,
        property: propObj?.name || propObj?.title || "Property",
        address: propObj?.address || "",
        priority: (r.priority || "Medium") as PriorityType,
        status: (r.status || "Pending") as StatusType,
        stage:
          r.status === "Completed"
            ? 4
            : r.status === "In Progress" || r.status === "Accepted"
            ? 3
            : r.status === "Assigned"
            ? 2
            : 1,
        stageText: r.status || "Pending",
        contractor: providerName,
        contractorPhone: providerObj?.phone || providerObj?.contactNumber,
        createdDate: createdDateStr,
        scheduledDate: scheduledDateStr,
        isOccupied: r.isOccupied,
        tenantName: r.tenantName,
        tenantPhone: r.tenantPhone,
        raw: r,
      };
    });
  }, [rawRequests]);

  // Counts for Stats Cards
  const pendingCount = useMemo(
    () => rawRequests.filter((r) => r.status === "Pending").length,
    [rawRequests]
  );
  const assignedCount = useMemo(
    () => rawRequests.filter((r) => r.status === "Assigned").length,
    [rawRequests]
  );
  const inProgressCount = useMemo(
    () =>
      rawRequests.filter(
        (r) => r.status === "In Progress" || r.status === "Accepted"
      ).length,
    [rawRequests]
  );
  const completedCount = useMemo(
    () => rawRequests.filter((r) => r.status === "Completed").length,
    [rawRequests]
  );
  const cancelledCount = useMemo(
    () =>
      rawRequests.filter(
        (r) => r.status === "Cancelled" || r.status === "Rejected"
      ).length,
    [rawRequests]
  );

  // Navigate to Track page using MongoDB _id
  const navigateToTrack = (idOrRequestNo: string) => {
    // Find matching request to get its _id
    const matched = mappedRequests.find(
      (m) => m.id === idOrRequestNo || m._id === idOrRequestNo
    );
    const targetId = matched?._id || idOrRequestNo;
    router.push(`/service-requests/track?id=${targetId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ServiceRequestHeader
        activeCount={mappedRequests.length}
        onOpenModal={() => setIsModalOpen(true)}
      />

      {/* Stats Cards */}
      <ServiceRequestStats
        pendingCount={pendingCount}
        assignedCount={assignedCount}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        cancelledCount={cancelledCount}
      />

      {/* Search Input Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-3.5 sm:p-2">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, title, or property..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Loading state or Table */}
      {isRequestsLoading ? (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#6B1294] animate-spin" />
          <p className="text-sm font-medium text-gray-600">Loading service requests...</p>
        </div>
      ) : (
        <ServiceRequestTable
          requests={mappedRequests}
          onNavigateToTrack={navigateToTrack}
          onStatusChange={() => {}}
        />
      )}

      {/* Create Modal */}
      <CreateServiceRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}