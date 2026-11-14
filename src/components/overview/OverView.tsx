"use client";

import { Building2, CheckCircle2, Receipt, Wrench, Clock, Info } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useGetMyPropertiesQuery, useGetPropertyManagerOverviewQuery } from "@/features/property/propertyApi";
import { useMyProfileQuery } from "@/features/profile/profileApi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const defaultMonthlyVolume = [
  { month: "Jan", volume: 0 },
  { month: "Feb", volume: 0 },
  { month: "Mar", volume: 0 },
  { month: "Apr", volume: 0 },
  { month: "May", volume: 0 },
  { month: "Jun", volume: 0 },
  { month: "Jul", volume: 0 },
  { month: "Aug", volume: 0 },
  { month: "Sep", volume: 0 },
  { month: "Oct", volume: 0 },
  { month: "Nov", volume: 0 },
  { month: "Dec", volume: 0 },
];

export default function Overview(): React.ReactElement {
  const { data: propertiesRes } = useGetMyPropertiesQuery();
  const { data: profileRes } = useMyProfileQuery(undefined);
  const { data: overviewRes, isLoading: isLoadingOverview } = useGetPropertyManagerOverviewQuery();
  const [isReturnedUser, setIsReturnedUser] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("projexpro_has_visited");
      if (seen) {
        setIsReturnedUser(true);
      } else {
        localStorage.setItem("projexpro_has_visited", "true");
        setIsReturnedUser(false);
      }
    }
  }, []);

  const profileUser = profileRes?.data || profileRes;
  const userName = profileUser?.firstName || profileUser?.userName || "there";

  const overviewData = overviewRes?.data;
  const stats = overviewData?.stats;

  const properties = propertiesRes?.data?.properties || [];
  const totalProperties = stats?.totalProperties ?? (propertiesRes?.data?.totalProperties ?? properties.length);
  const totalUnits = stats?.totalUnits ?? properties.reduce((sum, p) => sum + (p.totalUnits || 1), 0);

  const approvalsRequired = stats?.approvalsRequired ?? 0;
  const activeJobs = stats?.activeJobs ?? 0;
  const urgentJobs = stats?.urgentJobs ?? 0;
  const completedJobs = stats?.completedJobs ?? 0;
  const completedThisMonth = stats?.completedThisMonth ?? 0;

  const serviceRequestsData =
    overviewData?.serviceRequestsVolume && overviewData.serviceRequestsVolume.length > 0
      ? overviewData.serviceRequestsVolume
      : defaultMonthlyVolume;

  const recentActivities = overviewData?.recentActivities || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "building":
        return { icon: Building2, bg: "bg-blue-100 text-blue-600" };
      case "receipt":
        return { icon: Receipt, bg: "bg-amber-100 text-amber-600" };
      case "check":
        return { icon: CheckCircle2, bg: "bg-green-100 text-green-600" };
      case "wrench":
      default:
        return { icon: Wrench, bg: "bg-[#F2E7FC] text-[#8E25E3]" };
    }
  };

  const currentYear = new Date().getFullYear();
  const maxVolume = Math.max(...serviceRequestsData.map((d) => d.volume), 5);
  const yDomainUpper = Math.max(Math.ceil(maxVolume * 1.25), 10);

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          {isReturnedUser ? `Welcome back, ${userName}` : `Welcome to ProjexPro, ${userName}`} 👋
        </h1>
        <p className="text-sm text-gray-500 font-normal mt-1">
          Here&apos;s what&apos;s happening across your properties today.
        </p>
      </div>

      {/* Top 4 Stats Cards Grid - Uniform sizes matching Super Admin boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Approvals Required */}
        <Link
          href="/service-requests"
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#5B1B95]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs sm:text-sm font-normal text-gray-500 group-hover:text-gray-900 transition-colors">
              Approvals Required
            </span>
            <div className="p-2.5 rounded-lg bg-orange-100/90 text-orange-600 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-bold text-gray-900">
              {isLoadingOverview ? "..." : approvalsRequired}
            </h2>
            <p className={`text-xs font-semibold mt-1 ${approvalsRequired > 0 ? "text-orange-500" : "text-gray-500"}`}>
              {approvalsRequired > 0 ? "Needs attention" : "All caught up"}
            </p>
          </div>
        </Link>

        {/* Card 2: Active Jobs */}
        <Link
          href="/service-requests"
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#5B1B95]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs sm:text-sm font-normal text-gray-500 group-hover:text-gray-900 transition-colors">
              Active Jobs
            </span>
            <div className="p-2.5 rounded-lg bg-red-100/90 text-red-600 group-hover:scale-105 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-bold text-gray-900">
              {isLoadingOverview ? "..." : activeJobs}
            </h2>
            <p className="text-xs font-semibold text-gray-600 mt-1">
              <span className="text-red-600 font-bold">{urgentJobs} urgent</span>
            </p>
          </div>
        </Link>

        {/* Card 3: Completed Jobs */}
        <Link
          href="/service-requests"
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#5B1B95]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs sm:text-sm font-normal text-gray-500 group-hover:text-gray-900 transition-colors">
              Completed Jobs
            </span>
            <div className="p-2.5 rounded-lg bg-green-100/90 text-emerald-600 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-bold text-gray-900">
              {isLoadingOverview ? "..." : completedJobs}
            </h2>
            <p className="text-xs font-semibold text-emerald-600 mt-1">
              {completedThisMonth} this month
            </p>
          </div>
        </Link>

        {/* Card 4: Total Properties */}
        <Link
          href="/properties"
          className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 min-h-[120px] flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#5B1B95]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs sm:text-sm font-normal text-gray-500 group-hover:text-gray-900 transition-colors">
              Total Properties
            </span>
            <div className="p-2.5 rounded-lg bg-[#F2E7FC] text-[#8E25E3] group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-bold text-gray-900">
              {isLoadingOverview ? "..." : totalProperties}
            </h2>
            <p className="text-xs font-semibold text-[#8E25E3] mt-1">
              {totalUnits} Total units
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>

        {isLoadingOverview ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading recent activities...</div>
        ) : recentActivities.length > 0 ? (
          <div className="space-y-4">
            {recentActivities.map((act) => {
              const { icon: IconComp, bg: iconBg } = getActivityIcon(act.type);
              return (
                <div key={act.id} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className={`p-2.5 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {act.text}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-normal whitespace-nowrap shrink-0">
                    {act.time}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
            <Clock className="w-6 h-6 text-gray-300" />
            <p>No recent activity yet. When maintenance requests are created or updated, they will appear here.</p>
          </div>
        )}
      </div>

      {/* Service Requests Bar Chart Section */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900">Service Requests</h2>
          <p className="text-xs text-gray-500 font-normal mt-0.5">Monthly volume, {currentYear}</p>
        </div>

        <div className="h-[270px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serviceRequestsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                domain={[0, yDomainUpper]}
                allowDecimals={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                labelStyle={{ fontWeight: 600, color: "#111827" }}
                formatter={(val: number) => [`${val} requests`, "Volume"]}
              />
              <Bar
                dataKey="volume"
                fill="#8E25E3"
                radius={[6, 6, 0, 0]}
                barSize={34}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}