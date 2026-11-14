"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Clock, DollarSign } from "lucide-react";

interface InvoiceStatsProps {
  totalBalanceDue: number;
  overdueCount: number;
  pendingCount: number;
  paidHistoryAmount: number;
}

export default function InvoiceStatsCards({
  totalBalanceDue = 5000,
  overdueCount = 6,
  pendingCount = 5,
  paidHistoryAmount = 54000,
}: InvoiceStatsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Balance Due Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm font-medium text-gray-500">
            Total Balance Due
          </span>
          <div className="p-2.5 rounded-lg bg-purple-100/90 text-[#8E25E3]">
            <DollarSign className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-3xl font-bold tracking-tight text-[#8E25E3]">
            {formatCurrency(totalBalanceDue)}
          </h3>
        </div>
      </div>

      {/* 2. Overdue Invoices Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm font-medium text-gray-500">
            Overdue Invoices
          </span>
          <div className="p-2.5 rounded-lg bg-red-100/90 text-[#E53935]">
            <AlertCircle className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-3xl font-bold tracking-tight text-[#E53935]">
            {overdueCount}
          </h3>
        </div>
      </div>

      {/* 3. Awaiting Approval Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm font-medium text-gray-500">
            Awaiting Approval
          </span>
          <div className="p-2.5 rounded-lg bg-amber-100/90 text-[#D97706]">
            <Clock className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-3xl font-bold tracking-tight text-[#D97706]">
            {pendingCount}
          </h3>
        </div>
      </div>

      {/* 4. Total Paid Card */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] shadow-xs flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm font-medium text-gray-500">
            Total Paid
          </span>
          <div className="p-2.5 rounded-lg bg-green-100/90 text-[#16A34A]">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-3xl font-bold tracking-tight text-[#16A34A]">
            {formatCurrency(paidHistoryAmount)}
          </h3>
        </div>
      </div>
    </div>
  );
}
