"use client";

import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Save, Loader2, Camera } from "lucide-react";
import {
  useMyProfileQuery,
  useUpdateProfileByPropertyManagerMutation,
} from "@/features/profile/profileApi";
import { getPropertyImageUrl } from "@/utils/propertyUtils";

export default function ProfileTab() {
  const { data: profileRes, isLoading: isFetchingProfile } = useMyProfileQuery(undefined);
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileByPropertyManagerMutation();

  const user = profileRes?.data;

  const [profileData, setProfileData] = useState({
    // Profile Information
    firstName: "",
    lastName: "",
    username: "",
    jobTitle: "",
    email: "",
    phone: "",

    // Registered Business Information
    parentCompanyName: "",
    parentCompanyAddress: "",
    city: "",
    state: "",
    country: "United States",
    website: "",
    businessPhone: "",

    // Secondary Contact Information
    secFullName: "",
    secJobTitle: "",
    secEmail: "",
    secPhone: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when live user profile is loaded
  useEffect(() => {
    if (user) {
      const prof = user.profile || {};
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.userName || "",
        jobTitle: prof.jobTitle || "",
        email: user.email || "",
        phone: user.phone || user.contactNumber || "",

        parentCompanyName: prof.companyName || prof.legalBusinessName || "",
        parentCompanyAddress: prof.businessAddress || "",
        city: prof.city || "",
        state: prof.state || "",
        country: prof.country || "United States",
        website: prof.companyWebsiteUrl || "",
        businessPhone: prof.businessPhone || "",

        secFullName: prof.contactFullName || "",
        secJobTitle: prof.jobTitle || "",
        secEmail: prof.businessEmail || "",
        secPhone: prof.businessPhone || "",
      });

      if (user.image && !selectedFile) {
        setPreviewPhotoUrl(getPropertyImageUrl(user.image));
      }
    }
  }, [user]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo size should be less than 5MB");
        return;
      }
      setSelectedFile(file);
      const photoUrl = URL.createObjectURL(file);
      setPreviewPhotoUrl(photoUrl);
      toast.success("Photo selected! Click 'Save Changes' to update.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = "First Name is required";
    }
    if (!profileData.lastName.trim()) {
      newErrors.lastName = "Last Name is required";
    }
    if (!profileData.email.trim()) {
      newErrors.email = "Email Address is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload: Record<string, any> = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        userName: profileData.username.trim() || undefined,
        phone: profileData.phone.trim(),
        contactNumber: profileData.phone.trim(),
        profile: {
          jobTitle: profileData.jobTitle.trim(),
          companyName: profileData.parentCompanyName.trim(),
          legalBusinessName: profileData.parentCompanyName.trim(),
          businessAddress: profileData.parentCompanyAddress.trim(),
          city: profileData.city.trim(),
          state: profileData.state.trim(),
          country: profileData.country.trim(),
          companyWebsiteUrl: profileData.website.trim(),
          businessPhone: profileData.businessPhone.trim(),
          contactFullName: profileData.secFullName.trim(),
          businessEmail: profileData.secEmail.trim(),
        },
      };

      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);
        formData.append("data", JSON.stringify(payload));
        await updateProfile(formData).unwrap();
      } else {
        await updateProfile(payload).unwrap();
      }

      toast.success("Profile settings updated successfully!");
      setSelectedFile(null);
      setErrors({});
    } catch (err: any) {
      console.error("Update profile error:", err);
      const msg = err?.data?.message || err?.message || "Failed to update profile";
      toast.error(msg);
    }
  };

  const handleChangePhoto = () => {
    photoInputRef.current?.click();
  };

  const displayName = profileData.firstName || profileData.lastName
    ? `${profileData.firstName} ${profileData.lastName}`.trim()
    : (user?.userName || "Property Manager");

  const initials = (
    (profileData.firstName?.[0] || "") + (profileData.lastName?.[0] || "")
  ).toUpperCase() || "PM";

  if (isFetchingProfile && !user) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-16 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#6B1294] animate-spin" />
        <p className="text-sm font-semibold text-gray-700">Loading profile data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Hidden File Input for Avatar Photo */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/jpeg,image/png,image/jpg"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Top Profile Avatar Row */}
      <div className="flex items-center gap-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-5">
        <div
          onClick={handleChangePhoto}
          className="relative group cursor-pointer shrink-0"
          title="Click to change photo"
        >
          {previewPhotoUrl ? (
            <img
              src={previewPhotoUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-[#5B1B95]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#5B1B95] text-white flex items-center justify-center font-bold text-xl tracking-wider shadow-sm">
              {initials}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-semibold text-center p-1">
            <Camera className="w-4 h-4 mb-0.5" />
            <span>Change</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">
            {displayName}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {user?.role === "property_manager" ? "Property Manager" : "User"} · ProjexPro
          </p>
          <button
            type="button"
            onClick={handleChangePhoto}
            className="mt-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg px-3.5 py-1.5 transition-colors cursor-pointer"
          >
            Change Photo
          </button>
        </div>
      </div>

      {/* 1. Profile Information Box */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900 tracking-tight">
          Profile Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={profileData.firstName}
              onChange={handleChange}
              placeholder="e.g. Alex"
              className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all ${
                errors.firstName
                  ? "border-red-500 bg-red-50/20"
                  : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
              }`}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
                <span>⚠️</span> {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={profileData.lastName}
              onChange={handleChange}
              placeholder="e.g. Morgan"
              className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all ${
                errors.lastName
                  ? "border-red-500 bg-red-50/20"
                  : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
              }`}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
                <span>⚠️</span> {errors.lastName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={profileData.username}
              onChange={handleChange}
              placeholder="e.g. alexmorgan"
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Job Title / Department
            </label>
            <input
              type="text"
              name="jobTitle"
              value={profileData.jobTitle}
              onChange={handleChange}
              placeholder="e.g. Senior Property Manager"
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleChange}
              placeholder="e.g. alex@example.com"
              className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all ${
                errors.email
                  ? "border-red-500 bg-red-50/20"
                  : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
                <span>⚠️</span> {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={profileData.phone}
              onChange={handleChange}
              placeholder="e.g. +1 (555) 234-5678"
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Registered Business Information Box */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900 tracking-tight">
          Registered Business Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Parent Company Name
            </label>
            <input
              type="text"
              name="parentCompanyName"
              value={profileData.parentCompanyName}
              onChange={handleChange}
              placeholder="e.g. ProjexPro Management LLC"
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Parent Company Address
            </label>
            <input
              type="text"
              name="parentCompanyAddress"
              value={profileData.parentCompanyAddress}
              onChange={handleChange}
              placeholder="e.g. 100 Main Street, Suite 400"
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                City
              </label>
              <input
                type="text"
                name="city"
                value={profileData.city}
                onChange={handleChange}
                placeholder="e.g. Los Angeles"
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                State
              </label>
              <input
                type="text"
                name="state"
                value={profileData.state}
                onChange={handleChange}
                placeholder="e.g. CA"
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={profileData.country}
                onChange={handleChange}
                placeholder="e.g. United States"
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Website Address
              </label>
              <input
                type="text"
                name="website"
                value={profileData.website}
                onChange={handleChange}
                placeholder="e.g. https://projexpro.com"
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Business Phone
              </label>
              <input
                type="text"
                name="businessPhone"
                value={profileData.businessPhone}
                onChange={handleChange}
                placeholder="e.g. +1 (555) 234-5678"
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Secondary Contact Information Box */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900 tracking-tight">
          Secondary Contact Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              name="secFullName"
              value={profileData.secFullName}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Job Title / Department
            </label>
            <input
              type="text"
              name="secJobTitle"
              value={profileData.secJobTitle}
              onChange={handleChange}
              placeholder="e.g. Operations Coordinator"
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              name="secEmail"
              value={profileData.secEmail}
              onChange={handleChange}
              placeholder="e.g. operations@projexpro.com"
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="text"
              name="secPhone"
              value={profileData.secPhone}
              onChange={handleChange}
              placeholder="e.g. +1 (555) 987-6543"
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 rounded-lg text-sm text-gray-900 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-[#6B1294] hover:bg-[#580e7d] disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2 text-sm"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>
    </form>
  );
}
