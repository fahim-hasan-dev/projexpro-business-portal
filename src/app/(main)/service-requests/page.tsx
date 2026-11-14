"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { ServiceRequest, StatusType, PriorityType, IServiceRequest } from "@/types/serviceRequest";
import ServiceRequestHeader from "@/components/service-requests/ServiceRequestHeader";
import ServiceRequestStats from "@/components/service-requests/ServiceRequestStats";
import ServiceRequestTable from "@/components/service-requests/ServiceRequestTable";
import CreateServiceRequestModal from "@/components/service-requests/CreateServiceRequestModal";
import { useGetAllServiceRequestsQuery } from "@/features/serviceRequest/serviceRequestApi";

function ServiceRequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "";
  const isCanceledView = filterParam === "canceled";

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
        unit: r.unit,
        serviceCategory: r.serviceCategory,
        accessInstructions: r.accessInstructions,
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

  // Filter requests based on query param (e.g. Canceled view)
  const displayedRequests = useMemo(() => {
    if (isCanceledView) {
      return mappedRequests.filter(
        (r) =>
          r.status === "Cancelled" ||
          (r.status as string) === "Canceled" ||
          r.status === "Rejected"
      );
    }
    return mappedRequests;
  }, [mappedRequests, isCanceledView]);

  // Counts for 4 Stats Cards matching Super Admin style
  const submittedCount = useMemo(
    () => rawRequests.filter((r) => r.status === "Pending").length,
    [rawRequests]
  );
  const inProgressCount = useMemo(
    () =>
      rawRequests.filter(
        (r) =>
          r.status === "In Progress" ||
          r.status === "Accepted" ||
          r.status === "Assigned"
      ).length,
    [rawRequests]
  );
  const awaitingApprovalCount = useMemo(
    () => rawRequests.filter((r) => r.status === "Pending Approval").length,
    [rawRequests]
  );
  const completedCount = useMemo(
    () => rawRequests.filter((r) => r.status === "Completed").length,
    [rawRequests]
  );

  // Navigate to Track page using MongoDB _id
  const navigateToTrack = (idOrRequestNo: string) => {
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
        activeCount={displayedRequests.length}
        onOpenModal={() => setIsModalOpen(true)}
        title={isCanceledView ? "Canceled Requests" : "Service Requests"}
        subTitle={
          isCanceledView
            ? "View service requests that were canceled before completion."
            : "Track every service request from submission to resolution."
        }
      />

      {/* Stats Cards (4 Equal Boxes - hidden on Canceled view) */}
      {!isCanceledView && (
        <ServiceRequestStats
          submittedCount={submittedCount}
          inProgressCount={inProgressCount}
          awaitingApprovalCount={awaitingApprovalCount}
          completedCount={completedCount}
        />
      )}

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
          requests={displayedRequests}
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

export default function ServiceRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-gray-500">
          Loading service requests...
        </div>
      }
    >
      <ServiceRequestsContent />
    </Suspense>
  );
}
