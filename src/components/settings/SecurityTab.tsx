"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useChangePasswordMutation } from "@/features/auth/authApi";

export default function SecurityTab() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Current Password is required";
    }
    if (!newPassword) {
      newErrors.newPassword = "New Password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "New Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (newPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      }).unwrap();

      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (err: any) {
      console.error("Change password error:", err);
      const msg = err?.data?.message || err?.message || "Failed to update password";
      toast.error(msg);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6 sm:p-8 max-w-2xl space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#6B1294]" />
          <span>Change Password</span>
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Ensure your account is using a long, random password to stay secure.
        </p>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            Current Password *
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (e.target.value) setErrors((prev) => ({ ...prev, currentPassword: "" }));
              }}
              placeholder="••••••••••••"
              className={`w-full px-4 py-3 pr-10 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                errors.currentPassword
                  ? "border-red-500 bg-red-50/20"
                  : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
              <span>⚠️</span> {errors.currentPassword}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            New Password * (Min 8 characters)
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (e.target.value) setErrors((prev) => ({ ...prev, newPassword: "" }));
              }}
              placeholder="••••••••••••"
              className={`w-full px-4 py-3 pr-10 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                errors.newPassword
                  ? "border-red-500 bg-red-50/20"
                  : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
              <span>⚠️</span> {errors.newPassword}
            </p>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            Confirm New Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (e.target.value) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              placeholder="••••••••••••"
              className={`w-full px-4 py-3 pr-10 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                errors.confirmPassword
                  ? "border-red-500 bg-red-50/20"
                  : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
              <span>⚠️</span> {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-[#6B1294] hover:bg-[#580e7d] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{isLoading ? "Updating Password..." : "Update Password"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
