"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { VerificationFormData, IServiceProviderProfile } from "@/types/verification";
import { useMyProfileQuery, useUpdateProfileByServiceProviderMutation } from "@/features/profile/profileApi";
import VerificationSidebar from "@/components/verification/VerificationSidebar";
import VerificationHeaderNav from "@/components/verification/VerificationHeaderNav";
import Step1Welcome from "@/components/verification/Step1Welcome";
import Step2ContactInfo from "@/components/verification/Step2ContactInfo";
import Step3BusinessDetails from "@/components/verification/Step3BusinessDetails";
import Step4ReviewSubmit from "@/components/verification/Step4ReviewSubmit";
import Step5StatusPending from "@/components/verification/Step5StatusPending";

const yearsToLabel = (years?: number): string => {
  if (!years) return "";
  if (years <= 3) return "1-3 Years";
  if (years <= 5) return "3-5 Years";
  if (years <= 10) return "5-10 Years";
  return "10+ Years";
};

export default function VerificationPage() {
  const router = useRouter();

  // Fetch current user profile to determine role and approval status
  const { data: profileRes, isLoading: isProfileLoading, refetch } = useMyProfileQuery(undefined);
  const profileData = profileRes?.data || profileRes;
  const userRole = profileData?.role;
  const isServiceProvider = userRole === "service_provider" || userRole === "provider";
  const isPropertyManager = userRole === "property_manager" || userRole === "manager";

  const approvalStatus =
    profileData?.approvalStatus || profileData?.profile?.approvalStatus || "pending";
  const rejectionReason =
    profileData?.rejectionReason || profileData?.profile?.rejectionReason || "";
  const completionPercentage = Number(profileData?.profileCompletionPercentage ?? 0);

  // Update profile mutation
  const [updateProfile, { isLoading: isSubmitting }] = useUpdateProfileByServiceProviderMutation();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isProfilePreFilled, setIsProfilePreFilled] = useState<boolean>(false);

  const [formData, setFormData] = useState<VerificationFormData>({
    fullName: "",
    jobTitle: "",
    businessEmail: "",
    contactNumber: "",

    companyName: "",
    legalName: "",
    dbaName: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    taxId: "",

    portfolioSize: "",
    maintenance: "",
    propertyTypes: [],

    bio: "",
    skills: [],
    officeAddress: "",
    officeCity: "",
    officeState: "",
    officeZipCode: "",
    officePhone: "",

    yearsInBusiness: "",
    serviceRadius: "",
    serviceCategories: [],
    licenseNumber: "",
    licenses: [],

    profileImage: null,
    governmentIdFile: null,
    proofOfInsuranceFile: null,
    additionalDocuments: [],
  });

  // Pre-fill form data from profile API response
  useEffect(() => {
    if (!profileData || isProfilePreFilled) return;
    const profile: IServiceProviderProfile = profileData?.profile || {};

    setFormData((prev) => ({
      ...prev,
      fullName: [profileData?.firstName, profileData?.lastName].filter(Boolean).join(" ") || prev.fullName,
      jobTitle: (profile as any)?.jobTitle || prev.jobTitle,
      businessEmail: profileData?.email || prev.businessEmail,
      contactNumber: profile.officePhone || profileData?.contactNumber || profileData?.phone || prev.contactNumber,

      companyName: profile.companyName || prev.companyName,
      legalName: prev.legalName,
      dbaName: prev.dbaName,
      website: prev.website,
      address: profile.streetAddress || profile.officeAddress || prev.address,
      city: profile.city || profile.officeCity || prev.city,
      state: profile.state || profile.officeState || prev.state,
      zipCode: profile.zipCode || profile.officeZipCode || prev.zipCode,
      taxId: profile.taxId || prev.taxId,

      bio: profile.bio || prev.bio,
      skills: profile.skills || prev.skills,
      serviceCategories: profile.skills || prev.serviceCategories,

      officeAddress: profile.officeAddress || prev.officeAddress,
      officeCity: profile.officeCity || prev.officeCity,
      officeState: profile.officeState || prev.officeState,
      officeZipCode: profile.officeZipCode || prev.officeZipCode,
      officePhone: profile.officePhone || prev.officePhone,

      yearsInBusiness: profile.yearsInBusiness ? yearsToLabel(profile.yearsInBusiness) : prev.yearsInBusiness,

      profileImage: (profileData?.image as any) || (profile as any)?.imageUrl || prev.profileImage,
      governmentIdFile: (profile.governmentId as any) || prev.governmentIdFile,
      proofOfInsuranceFile: (profile.proofOfInsurance as any) || prev.proofOfInsuranceFile,
      additionalDocuments: (profile.documents || []).map((d, i) => ({
        title: d.title || `Document ${i + 1}`,
        fileUrl: d.fileUrl,
        type: d.type,
        file: null,
      })),
    }));

    setIsProfilePreFilled(true);
  }, [profileData, isProfilePreFilled]);

  // Handle role redirect if a Property Manager visits this page
  useEffect(() => {
    if (!profileData) return;
    if (isPropertyManager) {
      router.replace("/provider-manager/verification");
    }
  }, [profileData, isPropertyManager, router]);

  // Restore step on initial client mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const savedStep = localStorage.getItem("projexpro_sp_verification_step");
      if (savedStep) {
        const parsed = parseInt(savedStep, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
          setCurrentStep(parsed);
        }
      }
    }
  }, []);

  const updateStep = (step: number) => {
    setCurrentStep(step);
    if (typeof window !== "undefined") {
      localStorage.setItem("projexpro_sp_verification_step", String(step));
    }
  };

  // Synchronize step based on approval status:
  // Approved: direct entry into service provider dashboard with no subscription
  // Pending / Resubmitted: wait on Step 5
  // Rejected: show rejection screen with resubmit option
  useEffect(() => {
    if (!profileData || !isMounted || isPropertyManager) return;

    // 1. Approved Service Provider enters dashboard directly
    if (approvalStatus === "approved") {
      if (typeof window !== "undefined") {
        localStorage.removeItem("projexpro_sp_verification_step");
      }
      router.replace("/services_provider/overview");
      return;
    }

    // 2. Pending or Resubmitted: lock to Step 5 once submitted
    if ((approvalStatus === "pending" || approvalStatus === "resubmitted") && completionPercentage >= 100) {
      if (currentStep !== 5) {
        updateStep(5);
      }
      return;
    }

    // 3. Rejected: show rejection screen unless user is editing details
    if (approvalStatus === "rejected") {
      if (currentStep !== 2 && currentStep !== 3 && currentStep !== 4) {
        updateStep(5);
      }
      return;
    }
  }, [profileData, approvalStatus, completionPercentage, isMounted, isPropertyManager, router, currentStep]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateForm = (updater: (prev: VerificationFormData) => VerificationFormData) => {
    setFormData((prev) => updater(prev));
  };

  const handleSubmitApplication = async () => {
    try {
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const yearsNumMatch = formData.yearsInBusiness?.match(/(\d+)/);
      const yearsInBusinessNumber = yearsNumMatch ? parseInt(yearsNumMatch[1], 10) : 0;

      const skills = (formData.skills?.length ? formData.skills : formData.serviceCategories || []) as string[];

      const dataPayload = {
        firstName,
        lastName,
        phone: formData.contactNumber,
        profile: {
          streetAddress: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode || "",
          bio: formData.bio || "",
          skills,
          companyName: formData.companyName,
          officeAddress: formData.officeAddress || formData.address,
          officeCity: formData.officeCity || formData.city,
          officeState: formData.officeState || formData.state,
          officeZipCode: formData.officeZipCode || formData.zipCode || "",
          officePhone: formData.officePhone || formData.contactNumber,
          taxId: formData.taxId,
          yearsInBusiness: yearsInBusinessNumber,
        },
      };

      const hasAnyFile =
        formData.profileImage instanceof File ||
        formData.governmentIdFile instanceof File ||
        formData.proofOfInsuranceFile instanceof File ||
        (formData.additionalDocuments || []).some((d) => d.file instanceof File);

      let apiPayload: any;

      if (hasAnyFile) {
        const fd = new FormData();
        if (formData.profileImage instanceof File) fd.append("image", formData.profileImage);
        if (formData.governmentIdFile instanceof File) fd.append("governmentId", formData.governmentIdFile);
        if (formData.proofOfInsuranceFile instanceof File)
          fd.append("proofOfInsurance", formData.proofOfInsuranceFile);

        (formData.additionalDocuments || []).forEach((doc, idx) => {
          if (doc.file instanceof File) {
            fd.append(`documents`, doc.file);
            fd.append(`documentTitles`, doc.title || `Document ${idx + 1}`);
          }
        });

        fd.append("data", JSON.stringify(dataPayload));
        apiPayload = fd;
      } else {
        apiPayload = dataPayload;
      }

      const res = await updateProfile(apiPayload).unwrap();

      if (res?.success || res?.statusCode === 200) {
        toast.success(res?.message || "Application submitted! Admin review in progress...");
        updateStep(5);
        await refetch();
      } else {
        toast.error(res?.message || "Failed to submit application. Please try again.");
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      const errorMessage =
        error?.data?.message || error?.message || "Failed to submit application. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (!isMounted) return null;
  if (isProfileLoading && !isProfilePreFilled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#6B1294]"></div>
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If approved, show loader while redirecting to dashboard
  if (approvalStatus === "approved") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#6B1294]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F9FAFB]">
      <VerificationSidebar currentStep={Math.min(currentStep, 5)} isServiceProvider={isServiceProvider} />

      <div className="flex-1 flex flex-col min-h-screen">
        <VerificationHeaderNav />

        <div className="p-4 sm:p-8 md:p-10 flex-1">
          {currentStep === 1 && (
            <Step1Welcome onContinue={() => updateStep(2)} isServiceProvider={isServiceProvider} />
          )}

          {currentStep === 2 && (
            <Step2ContactInfo
              formData={formData}
              onChange={handleInputChange}
              onBack={() => updateStep(1)}
              onNext={() => updateStep(3)}
              isServiceProvider={isServiceProvider}
            />
          )}

          {currentStep === 3 && (
            <Step3BusinessDetails
              formData={formData}
              onChange={handleInputChange}
              onUpdateForm={handleUpdateForm}
              onBack={() => updateStep(2)}
              onNext={() => updateStep(4)}
              isServiceProvider={isServiceProvider}
            />
          )}

          {currentStep === 4 && (
            <Step4ReviewSubmit
              formData={formData}
              onEditStep={(st) => updateStep(st)}
              onBack={() => updateStep(3)}
              onSubmit={handleSubmitApplication}
              isServiceProvider={isServiceProvider}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 5 && (
            <Step5StatusPending
              formData={formData}
              approvalStatus={approvalStatus}
              rejectionReason={rejectionReason}
              isServiceProvider={true}
              onResubmit={() => updateStep(2)}
              onRefresh={() => refetch()}
              isRefreshing={isProfileLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

