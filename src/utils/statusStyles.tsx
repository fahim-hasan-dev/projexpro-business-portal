import React from "react";
import {
  Clock,
  Check,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  XCircle,
  Play,
} from "lucide-react";

export interface StatusStyleConfig {
  label: string;
  badgeClass: string;
  textColor: string;
  bgLight: string;
  borderColor: string;
  icon: React.ElementType;
}

export function getServiceRequestStatusConfig(rawStatus?: string): StatusStyleConfig {
  const status = (rawStatus || "").trim();

  switch (status) {
    case "Pending":
      return {
        label: "Pending Review",
        badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
        textColor: "text-amber-700",
        bgLight: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: Clock,
      };

    case "Assigned":
      return {
        label: "Assigned",
        badgeClass: "bg-purple-100 text-purple-800 border border-purple-200",
        textColor: "text-purple-700",
        bgLight: "bg-purple-50",
        borderColor: "border-purple-200",
        icon: Clock,
      };

    case "Accepted":
      return {
        label: "Accepted",
        badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
        textColor: "text-blue-700",
        bgLight: "bg-blue-50",
        borderColor: "border-blue-200",
        icon: Check,
      };

    case "In Progress":
      return {
        label: "In Progress",
        badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
        textColor: "text-indigo-700",
        bgLight: "bg-indigo-50",
        borderColor: "border-indigo-200",
        icon: Wrench,
      };

    case "Pending Approval":
    case "Awaiting Approval":
      return {
        label: "Pending Approval",
        badgeClass: "bg-orange-100 text-orange-800 border border-orange-200",
        textColor: "text-orange-700",
        bgLight: "bg-orange-50",
        borderColor: "border-orange-200",
        icon: Clock,
      };

    case "Completed":
      return {
        label: "Completed",
        badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
        textColor: "text-emerald-700",
        bgLight: "bg-emerald-50",
        borderColor: "border-emerald-200",
        icon: CheckCircle2,
      };

    case "Rejected":
    case "Declined":
    case "Reassignment Requested":
      return {
        label: status === "Declined" ? "Declined" : "Rejected",
        badgeClass: "bg-red-100 text-red-700 border border-red-200",
        textColor: "text-red-700",
        bgLight: "bg-red-50",
        borderColor: "border-red-200",
        icon: AlertTriangle,
      };

    case "Cancelled":
    case "Canceled":
      return {
        label: "Cancelled",
        badgeClass: "bg-gray-100 text-gray-700 border border-gray-200",
        textColor: "text-gray-600",
        bgLight: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: XCircle,
      };

    default:
      return {
        label: status || "Pending",
        badgeClass: "bg-gray-100 text-gray-700 border border-gray-200",
        textColor: "text-gray-700",
        bgLight: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: Clock,
      };
  }
}

export function getStatusBadgeStyle(status?: string): string {
  return getServiceRequestStatusConfig(status).badgeClass;
}

export interface ServiceRequestStatusBadgeProps {
  status?: string;
  showIcon?: boolean;
  customLabel?: string;
  className?: string;
}

export function ServiceRequestStatusBadge({
  status,
  showIcon = false,
  customLabel,
  className = "",
}: ServiceRequestStatusBadgeProps) {
  const config = getServiceRequestStatusConfig(status);
  const IconComp = config.icon;
  const label = customLabel || status || config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.badgeClass} ${className}`}
    >
      {showIcon && <IconComp className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </span>
  );
}
