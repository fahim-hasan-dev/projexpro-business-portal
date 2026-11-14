"use client";

import React from "react";
import { Plus } from "lucide-react";

interface ServiceRequestHeaderProps {
  activeCount: number;
  onOpenModal: () => void;
  title?: string;
  subTitle?: string;
}

export default function ServiceRequestHeader({
  activeCount,
  onOpenModal,
  title = "Service Requests",
  subTitle = "Track every service request from submission to resolution.",
}: ServiceRequestHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5 sm:mt-1">
          {subTitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenModal}
        className="bg-[#6B1294] hover:bg-[#580e7d] text-white font-semibold px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm shrink-0"
      >
        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>New Service Request</span>
      </button>
    </div>
  );
}
