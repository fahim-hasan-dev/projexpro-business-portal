"use client";

import React from "react";
import { Check, Eye } from "lucide-react";
import { Invoice } from "@/types/invoice";
import InvoiceStatusBadge from "./InvoiceStatusBadge";

interface InvoiceTableProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onPayInvoice: (id: string) => void;
}

export default function InvoiceTable({
  invoices,
  onViewInvoice,
  onPayInvoice,
}: InvoiceTableProps) {
  const fmtCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center border border-gray-200 shadow-xs">
        <p className="text-gray-500 font-medium text-base">
          No invoices match your current search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-4 px-5">INVOICE ID</th>
              <th className="py-4 px-5">DESCRIPTION / PROPERTY</th>
              <th className="py-4 px-5">SERVICE PRO</th>
              <th className="py-4 px-5">TOTAL COST</th>
              <th className="py-4 px-5">DEPOSIT PAID</th>
              <th className="py-4 px-5">REMAINING BAL.</th>
              <th className="py-4 px-5">START DATE</th>
              <th className="py-4 px-5">STATUS</th>
              <th className="py-4 px-5 text-center">ACTIONS</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="hover:bg-purple-50/20 transition-colors duration-150 group"
              >
                {/* INVOICE ID */}
                <td className="py-4 px-5 whitespace-nowrap">
                  <span className="font-bold text-[#8E25E3]">
                    {inv.id}
                  </span>
                </td>

                {/* DESCRIPTION / PROPERTY */}
                <td className="py-4 px-5 max-w-xs">
                  <div className="font-bold text-gray-900 line-clamp-1">
                    {inv.description}
                  </div>
                  <div className="text-xs text-gray-400 font-normal mt-0.5">
                    {inv.property}
                  </div>
                </td>

                {/* SERVICE PRO */}
                <td className="py-4 px-5 whitespace-nowrap font-medium text-gray-700 max-w-[160px] truncate">
                  {inv.serviceProvider}
                </td>

                {/* TOTAL COST */}
                <td className="py-4 px-5 whitespace-nowrap font-bold text-gray-900">
                  {fmtCurrency(inv.totalAmount)}
                </td>

                {/* DEPOSIT PAID */}
                <td className="py-4 px-5 whitespace-nowrap font-bold text-gray-900">
                  {fmtCurrency(inv.deposit)}
                </td>

                {/* REMAINING BAL. */}
                <td className="py-4 px-5 whitespace-nowrap font-bold text-gray-900">
                  {fmtCurrency(inv.totalDue)}
                </td>

                {/* START DATE */}
                <td
                  className={`py-4 px-5 whitespace-nowrap font-medium ${inv.status === "Overdue" ? "text-red-500" : "text-gray-500"
                    }`}
                >
                  {inv.startDate}
                </td>

                {/* STATUS BADGE */}
                <td className="py-4 px-5 whitespace-nowrap">
                  <InvoiceStatusBadge status={inv.status} />
                </td>

                {/* ACTIONS */}
                <td className="py-4 px-5 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {/* View Button (Eye) */}
                    <button
                      type="button"
                      onClick={() => onViewInvoice(inv)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer border border-gray-200/60"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Pay Button (Green Checkmark if unpaid/deposit) */}
                    {inv.status !== "Paid" && (
                      <button
                        type="button"
                        onClick={() => onPayInvoice(inv._id || inv.id)}
                        className="w-8 h-8 rounded-lg bg-[#DCFCE7] hover:bg-[#bbf7d0] text-[#16A34A] border border-[#BBF7D0] flex items-center justify-center transition-colors cursor-pointer"
                        title="Approve / Pay"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
