"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { ServiceRequest, StatusType } from "@/types/serviceRequest";

interface ServiceRequestTableProps {
  requests: ServiceRequest[];
  onNavigateToTrack: (id: string) => void;
  onStatusChange?: (id: string, newStatus: StatusType, newStage: number, stageText: string) => void;
}

export default function ServiceRequestTable({
  requests,
  onNavigateToTrack,
}: ServiceRequestTableProps) {
  if (requests.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-8 text-center">
        <p className="text-gray-500 font-medium text-sm">
          No service requests found matching your search.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg overflow-x-auto shadow-xs">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="border-b border-gray-300/60 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <th className="py-4 px-5">JOB ID</th>
            <th className="py-4 px-5">PROPERTY NAME</th>
            <th className="py-4 px-5">SCHEDULED DATE</th>
            <th className="py-4 px-5">PRIORITY LEVEL</th>
            <th className="py-4 px-5">STATUS</th>
            <th className="py-4 px-5">ASSIGNED TO</th>
            <th className="py-4 px-5">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-300/40 text-sm">
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-gray-100/60 transition-colors">
              {/* 1. JOB ID */}
              <td className="py-4 px-5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onNavigateToTrack(req.id)}
                  className="bg-[#F2E7FC] hover:bg-purple-200 text-[#8E25E3] font-bold text-xs px-3 py-1.5 rounded-sm inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{req.id}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </td>

              {/* 2. PROPERTY NAME (Title + Property subtitle) */}
              <td className="py-4 px-5">
                <div className="font-bold text-gray-900">{req.title}</div>
                <div className="text-xs text-gray-500 font-normal mt-0.5">{req.property}</div>
              </td>

              {/* 3. SCHEDULED DATE */}
              <td className="py-4 px-5 whitespace-nowrap text-xs font-semibold text-gray-900">
                {req.scheduledDate || req.createdDate || "July 20, 2026"}
              </td>

              {/* 4. PRIORITY LEVEL */}
              <td className="py-4 px-5 whitespace-nowrap">
                <span
                  className={`font-semibold text-xs px-3 py-1 rounded-full ${
                    req.priority === "Urgent"
                      ? "bg-red-100 text-red-600"
                      : req.priority === "High"
                      ? "bg-amber-100 text-amber-700"
                      : req.priority === "Medium"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {req.priority}
                </span>
              </td>

              {/* 5. STATUS */}
              <td className="py-4 px-5 whitespace-nowrap">
                <span
                  className={`font-semibold text-xs px-3 py-1 rounded-full ${
                    req.status === "In Progress"
                      ? "bg-purple-100 text-purple-700"
                      : req.status === "Assigned"
                      ? "bg-blue-100 text-blue-700"
                      : req.status === "Completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : req.status === "Pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {req.status}
                </span>
              </td>

              {/* 6. ASSIGNED TO */}
              <td className="py-4 px-5 whitespace-nowrap text-xs font-semibold text-gray-800">
                {req.contractor || "Unassigned"}
              </td>

              {/* 7. ACTIONS */}
              <td className="py-4 px-5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToTrack(req.id)}
                    className="border border-gray-300 bg-white/80 hover:bg-white text-gray-700 font-semibold px-3.5 py-2 rounded-lg text-xs cursor-pointer transition-colors shadow-2xs"
                  >
                    Track your Project
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
