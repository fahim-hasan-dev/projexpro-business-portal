"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  ChevronDown,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  Upload,
  Plus,
  Loader2,
  Check,
  X,
  Eye,
  ExternalLink,
  Download,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useMyProfileQuery,
  useUpdateProfileByServiceProviderMutation,
} from "@/features/profile/profileApi";
import { getPropertyImageUrl } from "@/utils/propertyUtils";
import { baseURL } from "@/utils/BaseURL";

interface DocumentItem {
  id: string;
  name: string;
  url: string;
  size?: string;
  badge: string;
  badgeColor: string;
  isNew?: boolean;
}

export default function ServiceProviderProfilePage() {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Profile Query & Mutation
  const { data: profileResponse, isLoading, refetch } = useMyProfileQuery(undefined);
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileByServiceProviderMutation();

  const user = profileResponse?.data || profileResponse?.user;

  // Personal Form State (Streamlined & Non-redundant)
  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
  });

  // Business Form State (Contains company info and primary service/office address)
  const [business, setBusiness] = useState({
    companyName: "",
    officeAddress: "",
    city: "",
    state: "",
    zipCode: "",
    officePhone: "",
    taxId: "",
    yearsInBusiness: "",
  });

  // Licenses
  const [licenses, setLicenses] = useState<
    Array<{
      licenseType: string;
      licenseNumber: string;
      dateIssued: string;
      stateIssued: string;
      licenseDocument?: string;
    }>
  >([]);

  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);

  const availableSkillOptions = [
    "Plumbing Repair & Install",
    "HVAC & Climate Control",
    "Electrical Repair",
    "Roofing & Exterior",
    "Flooring & Tiling",
    "Painting & Drywall",
    "Carpentry & Millwork",
    "Appliance Repair",
    "Landscaping & Grounds",
    "Pest Control",
    "Locksmith Services",
    "General Contracting",
  ];

  // Documents
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentItem[]>([]);
  const [newDocumentFiles, setNewDocumentFiles] = useState<File[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [imgError, setImgError] = useState<boolean>(false);

  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to format full URL
  const formatDocumentUrl = (path?: string): string => {
    if (!path) return "";
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("blob:") ||
      path.startsWith("data:")
    ) {
      return path;
    }
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `${baseURL}${clean}`;
  };

  // Sync state when backend profile loads
  useEffect(() => {
    if (user) {
      const p = user.profile || {};
      setPersonal({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || user.contactNumber || p.phone || "",
        bio: p.bio || "",
      });

      setBusiness({
        companyName: p.companyName || "",
        officeAddress: p.officeAddress || p.streetAddress || "",
        city: p.officeCity || p.city || "",
        state: p.officeState || p.state || "",
        zipCode: p.officeZipCode || p.zipCode || "",
        officePhone: p.officePhone || user.phone || "",
        taxId: p.taxId || "",
        yearsInBusiness: p.yearsInBusiness !== undefined && p.yearsInBusiness !== null ? String(p.yearsInBusiness) : "",
      });

      if (Array.isArray(p.licenses) && p.licenses.length > 0) {
        setLicenses(
          p.licenses.map((lic: any) => ({
            licenseType: lic.licenseType || lic.type || "Contractor License",
            licenseNumber: lic.licenseNumber || lic.number || "",
            dateIssued: lic.dateIssued ? lic.dateIssued.split("T")[0] : "",
            stateIssued: lic.stateIssued || "",
            licenseDocument: lic.licenseDocument || "",
          }))
        );
      } else {
        setLicenses([
          {
            licenseType: "Plumbing Contractor",
            licenseNumber: "TX-PL-209374",
            dateIssued: "2022-04-15",
            stateIssued: "TX",
          },
        ]);
      }

      if (Array.isArray(p.skills) && p.skills.length > 0) {
        setSkills(p.skills);
      } else {
        setSkills(["Plumbing Repair & Install", "HVAC & Climate Control"]);
      }

      if (user.image) {
        setAvatarPreview(getPropertyImageUrl(user.image));
        setImgError(false);
      } else {
        setAvatarPreview("");
      }

      // Collect all verified and uploaded documents
      const docs: DocumentItem[] = [];
      if (p.governmentId) {
        docs.push({
          id: "gov-id",
          name: "Government ID",
          url: formatDocumentUrl(p.governmentId),
          size: "Verified Document",
          badge: "Government I.D.",
          badgeColor: "bg-[#DBEAFE] text-[#2563EB]",
        });
      }
      if (p.proofOfInsurance) {
        docs.push({
          id: "insurance",
          name: "Proof of Insurance",
          url: formatDocumentUrl(p.proofOfInsurance),
          size: "Verified Certificate",
          badge: "Proof of Insurance",
          badgeColor: "bg-[#DCFCE7] text-[#16A34A]",
        });
      }
      if (Array.isArray(p.licenses)) {
        p.licenses.forEach((lic: any, idx: number) => {
          if (lic.licenseDocument) {
            docs.push({
              id: `lic-doc-${idx}`,
              name: `${lic.licenseType || "Trade"} License Document`,
              url: formatDocumentUrl(lic.licenseDocument),
              size: "Official License Copy",
              badge: "Trade License",
              badgeColor: "bg-[#FEF3C7] text-[#D97706]",
            });
          }
        });
      }
      if (Array.isArray(p.documents)) {
        p.documents.forEach((d: any, idx: number) => {
          const rawUrl = typeof d === "string" ? d : d.url;
          const rawName = typeof d === "string" ? d.split("/").pop() : d.name || `Document #${idx + 1}`;
          docs.push({
            id: `doc-${idx}`,
            name: rawName,
            url: formatDocumentUrl(rawUrl),
            size: "Uploaded File",
            badge: "Custom Document",
            badgeColor: "bg-purple-100 text-[#5B1B95]",
          });
        });
      }
      setUploadedDocuments(docs);
    }
  }, [user]);

  // Handle Avatar Change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Profile photo must be less than 5 MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setImgError(false);
      toast.success("Profile photo selected. Click 'Save Profile' to apply.");
    }
  };

  // Handle Document Upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10 MB");
        return;
      }
      setNewDocumentFiles((prev) => [...prev, file]);
      const localUrl = URL.createObjectURL(file);
      setUploadedDocuments((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: file.name,
          url: localUrl,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          badge: "New Upload",
          badgeColor: "bg-purple-100 text-[#5B1B95]",
          isNew: true,
        },
      ]);
      toast.success("Document attached! Click 'Save Profile' to upload.");
    }
  };

  const handleDeleteDoc = (index: number) => {
    setUploadedDocuments((prev) => prev.filter((_, i) => i !== index));
    toast.success("Document removed.");
  };

  const handleAddLicense = () => {
    setLicenses((prev) => [
      ...prev,
      {
        licenseType: "",
        licenseNumber: "",
        dateIssued: "",
        stateIssued: "",
      },
    ]);
  };

  const handleUpdateLicense = (
    index: number,
    field: "licenseType" | "licenseNumber" | "dateIssued" | "stateIssued",
    value: string
  ) => {
    setLicenses((prev) =>
      prev.map((lic, i) => (i === index ? { ...lic, [field]: value } : lic))
    );
  };

  const handleRemoveLicense = (index: number) => {
    setLicenses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkillInput("");
    }
  };

  // Submit Profile Changes
  const handleSaveProfile = async () => {
    try {
      const payload: Record<string, any> = {
        firstName: personal.firstName,
        lastName: personal.lastName,
        phone: personal.phone,
        profile: {
          bio: personal.bio,
          companyName: business.companyName,
          officeAddress: business.officeAddress,
          officeCity: business.city,
          officeState: business.state,
          officeZipCode: business.zipCode,
          streetAddress: business.officeAddress,
          city: business.city,
          state: business.state,
          zipCode: business.zipCode,
          officePhone: business.officePhone,
          taxId: business.taxId,
          yearsInBusiness: business.yearsInBusiness ? Number(business.yearsInBusiness) : undefined,
          licenses: licenses.map((lic) => ({
            licenseType: lic.licenseType,
            licenseNumber: lic.licenseNumber,
            dateIssued: lic.dateIssued,
            stateIssued: lic.stateIssued,
            licenseDocument: lic.licenseDocument || "",
          })),
          skills,
        },
      };

      if (avatarFile || newDocumentFiles.length > 0) {
        const formData = new FormData();
        formData.append("data", JSON.stringify(payload));
        if (avatarFile) {
          formData.append("image", avatarFile);
        }
        newDocumentFiles.forEach((doc) => {
          formData.append("documents", doc);
        });

        await updateProfile(formData).unwrap();
      } else {
        await updateProfile(payload).unwrap();
      }

      toast.success("Profile saved successfully!");
      setIsEditing(false);
      setNewDocumentFiles([]);
      setAvatarFile(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update profile");
    }
  };

  const getInitials = () => {
    const f = personal.firstName?.trim()?.[0] || user?.firstName?.[0] || "S";
    const l = personal.lastName?.trim()?.[0] || user?.lastName?.[0] || "P";
    return `${f}${l}`.toUpperCase();
  };

  const isImageFile = (url: string) => {
    const cleanUrl = url.split("?")[0].toLowerCase();
    return (
      cleanUrl.endsWith(".jpg") ||
      cleanUrl.endsWith(".jpeg") ||
      cleanUrl.endsWith(".png") ||
      cleanUrl.endsWith(".webp") ||
      cleanUrl.startsWith("data:image/") ||
      cleanUrl.includes("/image/") ||
      cleanUrl.includes("/governmentid/") ||
      cleanUrl.includes("/proofofinsurance/")
    );
  };

  const isPdfFile = (url: string) => {
    return url.split("?")[0].toLowerCase().endsWith(".pdf");
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Profile
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5 sm:mt-1">
            Manage your account details, business information, and service preferences.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isEditing && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setIsEditing(false);
                setNewDocumentFiles([]);
                setAvatarFile(null);
                refetch();
              }}
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold px-4 py-2.5 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-sm"
            >
              <X className="w-4 h-4 text-gray-500" />
              <span>Cancel</span>
            </button>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setIsEditing(true);
              }
            }}
            className={
              isEditing
                ? "bg-[#5B1B95] hover:bg-[#4a157a] text-white font-bold px-5 py-2.5 rounded-lg shadow-md shadow-purple-900/25 ring-2 ring-purple-500/20 hover:shadow-lg hover:shadow-purple-900/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-sm"
                : "bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold px-4 py-2.5 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-2 text-xs sm:text-sm"
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Saving Changes...</span>
              </>
            ) : isEditing ? (
              <>
                <Check className="w-4 h-4 text-white stroke-[3]" />
                <span>Save Profile</span>
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4 text-[#5B1B95]" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B1B95]" />
          <span className="text-sm text-gray-500">Loading profile data...</span>
        </div>
      ) : (
        /* Main 2 Column Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Profile Summary Card (4 Cols) */}
          <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6 shadow-2xs space-y-6 self-start">
            {/* Avatar Circle */}
            <div className="flex flex-col items-center text-center">
              <div
                className="relative group cursor-pointer"
                onClick={() => isEditing && avatarInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                {avatarPreview && !imgError ? (
                  <img
                    src={avatarPreview}
                    alt={`${personal.firstName} ${personal.lastName}`}
                    onError={() => setImgError(true)}
                    className="w-24 h-24 rounded-full object-cover border-2 border-[#5B1B95] shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#5B1B95] text-white font-bold text-3xl flex items-center justify-center shadow-md select-none">
                    {getInitials()}
                  </div>
                )}

                {isEditing && (
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#5B1B95] text-white flex items-center justify-center border-2 border-white shadow-xs hover:bg-[#4a157a] transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-gray-900 mt-4 leading-tight">
                {personal.firstName || personal.lastName
                  ? `${personal.firstName} ${personal.lastName}`.trim()
                  : user?.userName || "Service Provider"}
              </h2>

              <p className="text-xs text-gray-500 font-medium mt-1">
                {business.companyName || "Licensed Contractor"}
              </p>

              {user?.approvalStatus && (
                <span
                  className={`mt-2.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                    user.approvalStatus === "approved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : user.approvalStatus === "rejected"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {user.approvalStatus}
                </span>
              )}
            </div>

            {/* Contact Details List */}
            <div className="border-t border-gray-200 pt-4 space-y-3 text-xs text-gray-600 font-normal">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{personal.email || user?.email || "No email available"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{personal.phone || "No phone added"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>
                  {business.city && business.state
                    ? `${business.city}, ${business.state}`
                    : business.city || business.state || "Location not set"}
                </span>
              </div>
            </div>

            {/* SKILLS Box (Single Source of Truth, Fully Interactive) */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  OFFERED SKILLS ({skills.length})
                </h3>
              </div>

              {/* Skill Pills */}
              <div className="flex flex-wrap gap-1.5">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-[#F2E7FC] text-[#5B1B95] border border-[#E1D4F4] font-semibold text-xs px-3 py-1 rounded-full flex items-center gap-1.5"
                    >
                      <span>{skill}</span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleToggleSkill(skill)}
                          className="hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No skills listed yet.</p>
                )}
              </div>

              {/* Inline Skill Manager in Edit Mode */}
              {isEditing && (
                <div className="pt-2 space-y-2 border-t border-gray-100">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                      className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-between cursor-pointer"
                    >
                      <span>+ Select Standard Trades</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    </button>

                    {isSkillDropdownOpen && (
                      <div className="absolute left-0 right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2.5 z-30 max-h-48 overflow-y-auto space-y-1">
                        {availableSkillOptions.map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer p-1.5 hover:bg-purple-50 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={skills.includes(opt)}
                              onChange={() => handleToggleSkill(opt)}
                              className="accent-[#5B1B95]"
                            />
                            <span className="truncate">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Custom Skill Input */}
                  <form onSubmit={handleAddCustomSkill} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Custom skill..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 outline-none focus:border-[#5B1B95]"
                    />
                    <button
                      type="submit"
                      disabled={!newSkillInput.trim()}
                      className="px-3 py-1.5 bg-[#5B1B95] disabled:opacity-50 text-white text-xs font-semibold rounded-lg hover:bg-[#4a157a] transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Right Details Column (8 Cols) - Cleaned of Redundancy */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Personal Information */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Personal Information
                </h3>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  Your primary contact identity and professional overview.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={personal.firstName}
                    onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={personal.lastName}
                    onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={personal.email}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300/70 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={personal.phone}
                    onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bio / Contractor Overview
                </label>
                <textarea
                  rows={3}
                  disabled={!isEditing}
                  value={personal.bio}
                  onChange={(e) => setPersonal({ ...personal, bio: e.target.value })}
                  placeholder="Provide background information about your skills, certifications, and experience..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95] resize-none"
                />
              </div>
            </div>

            {/* 2. Business Information (Single Canonical Address) */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Business Information
                </h3>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  Business details, operating address, and licensing profile.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Business / Company Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={business.companyName}
                  onChange={(e) => setBusiness({ ...business, companyName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Office / Service Address
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={business.officeAddress}
                  onChange={(e) => setBusiness({ ...business, officeAddress: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={business.city}
                    onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={business.state}
                    onChange={(e) => setBusiness({ ...business, state: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={business.zipCode}
                    onChange={(e) => setBusiness({ ...business, zipCode: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Office Phone
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={business.officePhone}
                    onChange={(e) => setBusiness({ ...business, officePhone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tax ID (EIN / SSN)
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={business.taxId}
                    onChange={(e) => setBusiness({ ...business, taxId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Years in Business
                  </label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={business.yearsInBusiness}
                    onChange={(e) => setBusiness({ ...business, yearsInBusiness: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300/70 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                  />
                </div>
              </div>
            </div>

            {/* 3. License Information */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    License Information
                  </h3>
                  <p className="text-xs text-gray-500 font-normal mt-0.5">
                    Trade licenses, contractor credentials, and active certifications.
                  </p>
                </div>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddLicense}
                    className="bg-[#5B1B95] hover:bg-[#4a157a] text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add License</span>
                  </button>
                )}
              </div>

              {licenses.map((lic, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <ShieldCheck className="w-4 h-4 text-[#5B1B95]" />
                      <span>{lic.licenseType || `License #${idx + 1}`}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {lic.licenseDocument && (
                        <button
                          type="button"
                          onClick={() =>
                            setViewingDoc({
                              id: `lic-${idx}`,
                              name: `${lic.licenseType || "Trade"} License Document`,
                              url: formatDocumentUrl(lic.licenseDocument),
                              badge: "Trade License",
                              badgeColor: "bg-[#FEF3C7] text-[#D97706]",
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#5B1B95] bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Doc</span>
                        </button>
                      )}

                      {isEditing && licenses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLicense(idx)}
                          className="text-gray-400 hover:text-red-500 cursor-pointer p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        License Type / Classification
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={lic.licenseType}
                        onChange={(e) => handleUpdateLicense(idx, "licenseType", e.target.value)}
                        placeholder="e.g. Master Plumber"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        License Number
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={lic.licenseNumber}
                        onChange={(e) => handleUpdateLicense(idx, "licenseNumber", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Date Issued
                      </label>
                      <input
                        type="date"
                        disabled={!isEditing}
                        value={lic.dateIssued}
                        onChange={(e) => handleUpdateLicense(idx, "dateIssued", e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        State Issued
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={lic.stateIssued}
                        onChange={(e) => handleUpdateLicense(idx, "stateIssued", e.target.value)}
                        placeholder="e.g. TX"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 disabled:opacity-75 focus:outline-none focus:border-[#5B1B95]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. Documents & Verification (With View Option) */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Documents & Verification
                  </h3>
                  <p className="text-xs text-gray-500 font-normal mt-0.5">
                    Government ID, Proof of Insurance, and business certificates.
                  </p>
                </div>
              </div>

              {/* Upload Drag & Drop Area (Only visible in edit mode) */}
              {isEditing && (
                <>
                  <input
                    type="file"
                    ref={docInputRef}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleDocUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => docInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/50 rounded-lg p-6 text-center cursor-pointer transition-all"
                  >
                    <button
                      type="button"
                      className="bg-[#5B1B95] hover:bg-[#4a157a] text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-2 mb-2 shadow-2xs"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Document</span>
                    </button>
                    <p className="text-xs text-gray-600 font-semibold">
                      <span className="text-[#5B1B95] font-bold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      PDF, JPG, or PNG — Max 10 MB
                    </p>
                  </div>
                </>
              )}

              {/* Uploaded Documents List with View Option */}
              <div className="space-y-2.5">
                {uploadedDocuments.length > 0 ? (
                  uploadedDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 flex items-center justify-between gap-3 hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 text-[#5B1B95] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {doc.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-normal">
                            {doc.size || "Verified Document"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            doc.badgeColor || "bg-[#DBEAFE] text-[#2563EB]"
                          }`}
                        >
                          {doc.badge}
                        </span>

                        {/* VIEW OPTION BUTTON */}
                        <button
                          type="button"
                          onClick={() => setViewingDoc(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5B1B95] bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        {/* OPEN IN NEW TAB */}
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                            title="Open in new window"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(idx)}
                            className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors p-1"
                            title="Remove document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No verification documents attached yet.</p>
                )}
              </div>
            </div>

            {/* Bottom Highlighted Save Action Bar when in Edit Mode */}
            {isEditing && (
              <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50 border-2 border-purple-300 rounded-xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5B1B95] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Save Profile Changes
                    </h4>
                    <p className="text-xs text-gray-500">
                      Review your personal details, business info, and documents before saving.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      setIsEditing(false);
                      setNewDocumentFiles([]);
                      setAvatarFile(null);
                      refetch();
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg text-xs sm:text-sm shadow-2xs transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveProfile}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-[#5B1B95] hover:bg-[#4a157a] text-white font-bold rounded-lg text-xs sm:text-sm shadow-lg shadow-purple-900/30 ring-2 ring-purple-500/30 hover:shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl relative border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileCheck className="w-5 h-5 text-[#5B1B95] shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {viewingDoc.name}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${viewingDoc.badgeColor}`}>
                    {viewingDoc.badge}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {viewingDoc.url && (
                  <a
                    href={viewingDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content Preview */}
            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-gray-50/50 min-h-[300px]">
              {isImageFile(viewingDoc.url) ? (
                <div className="max-w-full max-h-[70vh] flex items-center justify-center">
                  <img
                    src={viewingDoc.url}
                    alt={viewingDoc.name}
                    className="max-h-[70vh] max-w-full object-contain rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>
              ) : isPdfFile(viewingDoc.url) ? (
                <iframe
                  src={viewingDoc.url}
                  title={viewingDoc.name}
                  className="w-full h-[65vh] rounded-lg border border-gray-300"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-16 h-16 text-[#5B1B95] mx-auto opacity-70" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{viewingDoc.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Preview is not directly embeddable for this format.
                    </p>
                  </div>
                  <a
                    href={viewingDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B1B95] text-white text-xs font-semibold rounded-lg hover:bg-[#4a157a] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download / Open File</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-end bg-white">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
