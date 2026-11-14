"use client";

import React from "react";
import { Search } from "lucide-react";

export type FilterTab = "All" | "Due" | "Awaiting Approval" | "Overdue" | "Paid";

interface InvoiceFiltersProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  counts: {
    all: number;
    due?: number;
    awaitingApproval?: number;
    overdue?: number;
    paid?: number;
    pending?: number;
  };
}

export default function InvoiceFilters({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  counts,
}: InvoiceFiltersProps) {
  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "All", label: "All" },
    { key: "Due", label: "Due", count: counts.due },
    { key: "Awaiting Approval", label: "Awaiting Approval", count: counts.awaitingApproval ?? counts.pending },
    { key: "Overdue", label: "Overdue", count: counts.overdue },
    { key: "Paid", label: "Paid", count: counts.paid },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Tabs Pill Bar */}
      <div className="inline-flex items-center p-1 bg-[#E5E7EB]/80 border border-gray-300/50 rounded-lg w-full sm:w-fit overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${isActive
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${isActive
                    ? "bg-gray-200 text-gray-800"
                    : "bg-gray-300/70 text-gray-600"
                    }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full sm:w-72 md:w-80">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search invoices..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs"
        />
      </div>
    </div>
  );
}
