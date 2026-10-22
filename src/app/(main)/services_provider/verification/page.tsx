"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ShieldCheck,
  Trash2,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
  UserCheck,
  Wrench,
  Award,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useMyProfileQuery,
  useUpdateProfileByServiceProviderMutation,
} from "@/features/profile/profileApi";

export default function ServiceProviderVerificationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // RTK Query
  const { data: profileResponse, isLoading: isProfileLoading, refetch } = useMyProfileQuery(undefined);
  const [updateProfile, { isLoading: isSubmitting }] = useUpdateProfileByServiceProviderMutation();

  const user = profileResponse?.data || profileResponse?.user;

  // Form State
  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    bio: "",
  });

  const [business, setBusiness] = useState({
    companyName: "",
    officeAddress: "",
    city: "",
    state: "",
    zipCode: "",
    officePhone: "",
    taxId: "",
    yearsInBusiness: "5",
  });

  const [license, setLicense] = useState({
    type: "Plumbing Contractor",
    number: "TX-PL-209374",
    dateIssued: "2022-05-15",
    stateIssued: "TX",
  });

  const [skills, setSkills] = useState<string[]>([
    "Plumbing",
    "Electrical",
    "HVAC",
    "Flooring",
    "Painting",
    "Roofing",
  ]);

  const availableSkills = [
    "Plumbing",
    "Electrical",
    "HVAC",
    "Flooring",
    "Painting",
    "Roofing",
    "Carpentry",
    "Appliance Repair",
    "Landscaping",
    "Pest Control",
    "General Contracting",
  ];

  const [documents, setDocuments] = useState<
    Array<{
      id: string;
      name: string;
      size: string;
      badge: string;
      badgeColor: string;
    }>
  >([
    {
      id: "1",
      name: "Government_ID.pdf",
      size: "1.2 MB",
      badge: "Government I.D.",
      badgeColor: "bg-[#DBEAFE] text-[#2563EB]",
    },
    {
      id: "2",
      name: "Insurance_Certificate_2026.pdf",
      size: "840 KB",
      badge: "Proof of Insurance",
      badgeColor: "bg-[#DCFCE7] text-[#16A34A]",
    },
  ]);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // Sync profile data
  useEffect(() => {
    if (user) {
      const p = user.profile || {};
      setPersonal({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || user.contactNumber || p.phone || "",
        streetAddress: p.streetAddress || "",
        city: p.city || "",
        state: p.state || "",
        zipCode: p.zipCode || "",
        bio: p.bio || "",
      });

      setBusiness({
        companyName: p.companyName || "",
        officeAddress: p.officeAddress || "",
        city: p.officeCity || p.city || "",
        state: p.officeState || p.state || "",
        zipCode: p.officeZipCode || p.zipCode || "",
        officePhone: p.officePhone || "",
        taxId: p.taxId || "",
        yearsInBusiness: p.yearsInBusiness ? String(p.yearsInBusiness) : "5",
      });

      if (Array.isArray(p.skills) && p.skills.length > 0) {
        setSkills(p.skills);
      }

      if (Array.isArray(p.licenses) && p.licenses.length > 0) {
        const lic = p.licenses[0];
        setLicense({
          type: lic.type || lic.licenseType || "Contractor",
          number: lic.number || lic.licenseNumber || "",
          dateIssued: lic.dateIssued || "",
          stateIssued: lic.stateIssued || "",
        });
      }
    }
  }, [user]);

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFiles((prev) => [...prev, file]);
      const newDoc = {
        id: Date.now().toString(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        badge: "Custom Document",
        badgeColor: "bg-purple-100 text-[#5B1B95]",
      };
      setDocuments([...documents, newDoc]);
      toast.success("Document attached successfully!");
    }
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
    toast.success("Document removed.");
  };

  const handleCompleteOnboarding = async () => {
    try {
      const payload: Record<string, any> = {
        firstName: personal.firstName,
        lastName: personal.lastName,
        phone: personal.phone,
        profile: {
          streetAddress: personal.streetAddress,
          city: personal.city,
          state: personal.state,
          zipCode: personal.zipCode,
          bio: personal.bio,
          companyName: business.companyName,
          officeAddress: business.officeAddress,
          officeCity: business.city,
          officeState: business.state,
          officeZipCode: business.zipCode,
          officePhone: business.officePhone,
          taxId: business.taxId,
          yearsInBusiness: Number(business.yearsInBusiness) || 1,
          licenses: [license],
          skills,
        },
      };

      if (newFiles.length > 0) {
        const formData = new FormData();
        formData.append("data", JSON.stringify(payload));
        newFiles.forEach((file) => {
          formData.append("documents", file);
        });
        await updateProfile(formData).unwrap();
      } else {
        await updateProfile(payload).unwrap();
      }

      toast.success("Service Provider Onboarding Completed!");
      await refetch();
      router.push("/services_provider/overview");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save verification info");
    }
  };

  const steps = [
    { id: 1, title: "Personal Details", icon: UserCheck },
    { id: 2, title: "Business Info", icon: Building2 },
    { id: 3, title: "Licenses & Skills", icon: Wrench },
    { id: 4, title: "Documents & Submit", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-[#6B1294] text-white p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold bg-white/20 px-3 py-1 rounded-full text-white">
            Service Provider Onboarding
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">
            Complete Your Provider Profile
          </h1>
          <p className="text-sm text-purple-100 mt-1">
            Please fill out your personal, business, license, and document details to unlock full platform access.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-lg border border-white/20 shrink-0">
          <span className="text-xs font-medium">Status:</span>
          <span className="text-xs font-bold bg-amber-400 text-gray-900 px-2.5 py-0.5 rounded-full">
            {user?.approvalStatus || "Pending Verification"}
          </span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStep(step.id)}
              className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                isActive
                  ? "bg-white border-[#6B1294] ring-2 ring-[#6B1294]/20 shadow-xs"
                  : isDone
                  ? "bg-purple-50/50 border-purple-200 text-purple-900"
                  : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? "bg-[#6B1294] text-white"
                    : isDone
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Step {step.id}
                </p>
                <p className={`text-sm font-bold ${isActive || isDone ? "text-gray-900" : "text-gray-400"}`}>
                  {step.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs">
        {isProfileLoading ? (
          <div className="py-16 text-center text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#6B1294]" />
            <span>Loading provider information...</span>
          </div>
        ) : (
          <>
            {/* STEP 1: PERSONAL DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Personal Details</h2>
                  <p className="text-xs text-gray-500">Provide your personal contact and location information.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={personal.firstName}
                      onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={personal.lastName}
                      onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      disabled
                      value={personal.email}
                      className="w-full px-4 h-[46px] bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      value={personal.phone}
                      onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={personal.streetAddress}
                    onChange={(e) => setPersonal({ ...personal, streetAddress: e.target.value })}
                    className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={personal.city}
                      onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={personal.state}
                      onChange={(e) => setPersonal({ ...personal, state: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={personal.zipCode}
                      onChange={(e) => setPersonal({ ...personal, zipCode: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="bg-[#6B1294] hover:bg-[#580e7d] text-white font-semibold px-6 py-3 rounded-lg text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Continue to Business Info</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: BUSINESS INFO */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
                  <p className="text-xs text-gray-500">Specify your business entity details and tax identification.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Business / Company Name *</label>
                  <input
                    type="text"
                    value={business.companyName}
                    onChange={(e) => setBusiness({ ...business, companyName: e.target.value })}
                    className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Office Address</label>
                  <input
                    type="text"
                    value={business.officeAddress}
                    onChange={(e) => setBusiness({ ...business, officeAddress: e.target.value })}
                    className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={business.city}
                      onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={business.state}
                      onChange={(e) => setBusiness({ ...business, state: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={business.zipCode}
                      onChange={(e) => setBusiness({ ...business, zipCode: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Office Phone</label>
                    <input
                      type="text"
                      value={business.officePhone}
                      onChange={(e) => setBusiness({ ...business, officePhone: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tax I.D. Number</label>
                    <input
                      type="text"
                      value={business.taxId}
                      onChange={(e) => setBusiness({ ...business, taxId: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Years in Business</label>
                    <input
                      type="number"
                      value={business.yearsInBusiness}
                      onChange={(e) => setBusiness({ ...business, yearsInBusiness: e.target.value })}
                      className="w-full px-4 h-[46px] bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="bg-[#6B1294] hover:bg-[#580e7d] text-white font-semibold px-6 py-3 rounded-lg text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Continue to Licenses & Skills</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: LICENSES & SKILLS */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Licenses & Skills</h2>
                  <p className="text-xs text-gray-500">List your professional certifications and active skills.</p>
                </div>

                {/* License Box */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <ShieldCheck className="w-5 h-5 text-[#6B1294]" />
                    <span>Professional License</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">License Type</label>
                      <input
                        type="text"
                        value={license.type}
                        onChange={(e) => setLicense({ ...license, type: e.target.value })}
                        className="w-full px-4 h-[46px] bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">License Number</label>
                      <input
                        type="text"
                        value={license.number}
                        onChange={(e) => setLicense({ ...license, number: e.target.value })}
                        className="w-full px-4 h-[46px] bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Date Issued</label>
                      <input
                        type="date"
                        value={license.dateIssued}
                        onChange={(e) => setLicense({ ...license, dateIssued: e.target.value })}
                        className="w-full px-4 h-[46px] bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">State Issued</label>
                      <input
                        type="text"
                        value={license.stateIssued}
                        onChange={(e) => setLicense({ ...license, stateIssued: e.target.value })}
                        className="w-full px-4 h-[46px] bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#6B1294]"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Select Your Offered Services / Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.map((sk) => {
                      const isSelected = skills.includes(sk);
                      return (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => toggleSkill(sk)}
                          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#6B1294] text-white shadow-xs"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {sk} {isSelected ? "✓" : "+"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="bg-[#6B1294] hover:bg-[#580e7d] text-white font-semibold px-6 py-3 rounded-lg text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Continue to Documents</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: DOCUMENTS & SUBMIT */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Documents & Submit Application</h2>
                  <p className="text-xs text-gray-500">Upload your ID and proof of insurance documents to finalize onboarding.</p>
                </div>

                {/* Document Upload Box */}
                <input
                  type="file"
                  ref={docInputRef}
                  accept=".pdf,.jpg,.png"
                  onChange={handleDocUpload}
                  className="hidden"
                />
                <div
                  onClick={() => docInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-200 bg-purple-50/30 hover:bg-purple-50/60 rounded-xl p-8 text-center cursor-pointer transition-all"
                >
                  <button
                    type="button"
                    className="bg-[#6B1294] hover:bg-[#580e7d] text-white font-semibold px-5 py-2.5 rounded-lg text-xs inline-flex items-center gap-2 mb-2 shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Document</span>
                  </button>
                  <p className="text-xs text-gray-600 font-semibold">
                    Click to upload Govt ID, License Copy, or Proof of Insurance
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PDF, JPG or PNG (Max 10 MB each)</p>
                </div>

                {/* Uploaded Documents List */}
                <div className="space-y-2.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 text-[#6B1294] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{doc.name}</h4>
                          <p className="text-[10px] text-gray-400 font-normal">{doc.size}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${doc.badgeColor}`}>
                          {doc.badge}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCompleteOnboarding}
                    className="bg-[#6B1294] hover:bg-[#580e7d] disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-lg text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    <span>{isSubmitting ? "Submitting..." : "Complete Onboarding & Access Dashboard"}</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
