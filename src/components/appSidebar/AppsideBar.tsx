"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Building2,
  LayoutGrid,
  LogOut,
  Receipt,
  Settings,
  User,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { removeToken } from "@/utils/storage";
import { logout } from "@/features/auth/authSlice";
import { baseApi } from "@/utils/apiBaseQuery";

function ProjexProLogo() {
  return (
    <div className="flex items-center">
      <Image
        src="/logo/logo.png"
        alt="ProjexPro Logo"
        width={578}
        height={515}
        className="h-[68px] w-auto object-contain"
        priority
      />
    </div>
  );
}

type SidebarSubItem = {
  name: string;
  path: string;
};

type SidebarItem = {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SidebarSubItem[];
};

const defaultSidebars: SidebarItem[] = [
  { name: "Dashboard", path: "/", icon: LayoutGrid },
  { name: "Properties", path: "/properties", icon: Building2 },
  {
    name: "Service Requests",
    path: "/service-requests",
    icon: Wrench,
    subItems: [
      { name: "Canceled Requests", path: "/service-requests?filter=canceled" },
    ],
  },
  { name: "Invoices & Payments", path: "/invoices", icon: Receipt },
  { name: "Settings", path: "/settings", icon: Settings },
];

const serviceProviderSidebars: SidebarItem[] = [
  { name: "Dashboard", path: "/services_provider/overview", icon: LayoutGrid },
  { name: "Job Request", path: "/services_provider/job_request", icon: Wrench },
  { name: "Profile", path: "/services_provider/profile", icon: User },
  { name: "Invoices & Payments", path: "/services_provider/payment", icon: Receipt },
  { name: "Settings", path: "/services_provider/settings", icon: Settings },
];

export default function OptimusSidebar() {
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();

  const dispatch = useDispatch();

  const [currentSearch, setCurrentSearch] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentSearch(window.location.search);
    }
  }, [pathname]);

  const isServiceProvider = pathname.startsWith("/services_provider");
  const sidebars = isServiceProvider ? serviceProviderSidebars : defaultSidebars;

  const isActive = (path: string) => {
    if (path === "/" || path === "/services_provider/overview") {
      return pathname === path;
    }
    if (path === "/service-requests") {
      return pathname.startsWith("/service-requests") && !currentSearch.includes("filter=canceled");
    }
    return pathname.startsWith(path);
  };

  const confirmLogout = () => {
    removeToken();
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    toast.success("Logged out successfully");
    setShowLogoutModal(false);
    router.push("/auth/login");
  };

  return (
    <>
      <Sidebar className="border-r border-[#E5E7EB] bg-[#FFFFFF]">
        {/* Header Logo */}
        <SidebarHeader className="h-[81px] px-4 sm:px-5 border-b border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-start shrink-0">
          <Link href="/" className="block">
            <ProjexProLogo />
          </Link>
        </SidebarHeader>

        {/* Main Menu items */}
        <SidebarContent className="bg-[#FFFFFF] p-3">
          <SidebarMenu className="space-y-1.5">
            {sidebars.map((item) => {
              const active = isActive(item.path);
              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    className={`h-11 px-4 rounded-lg transition-all duration-200 flex items-center justify-between w-full cursor-pointer ${active
                      ? "bg-[#E1D4F4] text-[#8E25E3] font-semibold hover:bg-[#E1D4F4] hover:text-[#8E25E3]"
                      : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 font-medium"
                      }`}
                  >
                    <Link
                      href={item.path}
                      onClick={() => {
                        if (item.path === "/service-requests") setCurrentSearch("");
                      }}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 ${active ? "text-[#8E25E3]" : "text-gray-600"}`} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      {active && <span className="w-2 h-2 rounded-full bg-[#8E25E3]" />}
                    </Link>
                  </SidebarMenuButton>

                  {/* Sub-items (e.g. Canceled Requests under Service Requests) */}
                  {item.subItems && pathname.startsWith(item.path) && (
                    <div className="ml-7 pl-3 border-l-2 border-purple-200 mt-1 space-y-1">
                      {item.subItems.map((sub) => {
                        const isSubActive =
                          pathname === "/service-requests" && currentSearch.includes("filter=canceled");
                        return (
                          <Link
                            key={sub.name}
                            href={sub.path}
                            onClick={() => setCurrentSearch("?filter=canceled")}
                            className={`block px-3 py-1.5 text-xs rounded-md transition-colors ${
                              isSubActive
                                ? "bg-[#E1D4F4] text-[#8E25E3] font-bold"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                            title="View service requests that were canceled before completion."
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        {/* Footer Logout Button */}
        <SidebarFooter className="p-3 border-t border-[#E5E7EB] bg-[#FFFFFF]">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[#E53935] hover:bg-red-50/80 font-semibold text-sm transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 text-[#E53935]" />
            <span>Logout</span>
          </button>
        </SidebarFooter>
      </Sidebar>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 ease-out">
            {/* Warning Icon Circle */}
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 text-[#E53935]">
              <LogOut className="w-8 h-8 text-[#E53935]" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-sm text-gray-500 mb-6 font-normal">
              Are you sure you want to log out of your ProjexPro account?
            </p>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-3 px-4 bg-[#E53935] hover:bg-red-700 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}