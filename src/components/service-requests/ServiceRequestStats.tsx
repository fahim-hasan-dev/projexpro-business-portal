"use client";

import React from "react";

interface ServiceRequestStatsProps {
  submittedCount: number;
  inProgressCount: number;
  awaitingApprovalCount: number;
  completedCount: number;
}

export default function ServiceRequestStats({
  submittedCount,
  inProgressCount,
  awaitingApprovalCount,
  completedCount,
}: ServiceRequestStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Submitted */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
        <span className="text-3xl font-bold text-[#FF9F00]">{submittedCount}</span>
        <span className="text-xs sm:text-sm font-medium text-gray-500 mt-2">Submitted</span>
      </div>

      {/* 2. In Progress */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
        <span className="text-3xl font-bold text-[#2563EB]">{inProgressCount}</span>
        <span className="text-xs sm:text-sm font-medium text-gray-500 mt-2">In Progress</span>
      </div>

      {/* 3. Awaiting Approval */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
        <span className="text-3xl font-bold text-[#8E25E3]">{awaitingApprovalCount}</span>
        <span className="text-xs sm:text-sm font-medium text-gray-500 mt-2">Awaiting Approval</span>
      </div>

      {/* 4. Completed */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
        <span className="text-3xl font-bold text-[#16A34A]">{completedCount}</span>
        <span className="text-xs sm:text-sm font-medium text-gray-500 mt-2">Completed</span>
      </div>
    </div>
  );
}
