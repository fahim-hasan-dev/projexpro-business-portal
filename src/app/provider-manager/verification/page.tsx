"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { VerificationFormData, IPropertyManagerProfile } from "@/types/verification";
import { useMyProfileQuery, useUpdateProfileByPropertyManagerMutation } from "@/features/profile/profileApi";
import VerificationSidebar from "@/components/verification/VerificationSidebar";
import VerificationHeaderNav from "@/components/verification/VerificationHeaderNav";
import Step1Welcome from "@/components/verification/Step1Welcome";
import Step2ContactInfo from "@/components/verification/Step2ContactInfo";
import Step3BusinessDetails from "@/components/verification/Step3BusinessDetails";
import Step4ReviewSubmit from "@/components/verification/Step4ReviewSubmit";
import Step5StatusPending from "@/components/verification/Step5StatusPending";
import Step6AccountApproved from "@/components/verification/Step6AccountApproved";
import Step7ChoosePlan, { SelectedPlanInfo } from "@/components/verification/Step7ChoosePlan";
import Step8BillingActivation from "@/components/verification/Step8BillingActivation";

const portfolioSizeToNumber = (val?: string | number): number => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  switch (val) {
    case "1-10 Units":
      return 10;
    case "11-50 Units":
      return 50;
    case "51-200 Units":
      return 200;
    case "201-500 Units":
      return 500;
    case "501+ Units":
      return 501;
    default: {
      const rangeMatch = String(val).match(/-(\d+)/);
      if (rangeMatch) return parseInt(rangeMatch[1], 10);
      const plusMatch = String(val).match(/(\d+)\+/);
      if (plusMatch) return parseInt(plusMatch[1], 10);
      const numMatch = String(val).match(/\d+/);
      return numMatch ? parseInt(numMatch[0], 10) : 0;
    }
  }
};

const numberToPortfolioSizeLabel = (num?: number | string): string => {
  if (!num) return "";
  if (typeof num === "string" && isNaN(Number(num))) return num;
  const n = Number(num);
  if (n <= 10) return "1-10 Units";
  if (n <= 50) return "11-50 Units";
  if (n <= 200) return "51-200 Units";
  if (n <= 500) return "201-500 Units";
  return "501+ Units";
};

export default function VerificationPage() {
  const router = useRouter();

  const { data: profileRes, isLoading: isProfileLoading, refetch } = useMyProfileQuery(undefined);
  const profileData = profileRes?.data || profileRes;
  const userRole = profileData?.role;
  const isServiceProvider = userRole === "service_provider" || userRole === "provider";

  const approvalStatus =
    profileData?.approvalStatus || profileData?.profile?.approvalStatus || "pending";
  const rejectionReason =
    profileData?.rejectionReason || profileData?.profile?.rejectionReason || "";
  const isSubscribed = Boolean(
    profileData?.subscribe || profileData?.subscription?.status === "active"
  );
  const completionPercentage = Number(profileData?.profileCompletionPercentage ?? 0);

  const [updateProfile, { isLoading: isSubmitting }] = useUpdateProfileByPropertyManagerMutation();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isProfilePreFilled, setIsProfilePreFilled] = useState<boolean>(false);

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlanInfo>({
    id: "6ab0ac02da68611ab0818484",
    name: "ProjexPro Pro",
    planType: "pro",
    pricePerUnit: 2.0,
    monthlyMinimum: 2000,
    activeUnits: 1250,
    estimatedTotal: 2500,
  });

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

  // Pre-fill from profile
  useEffect(() => {
    if (!profileData || isProfilePreFilled) return;
    const profile: IPropertyManagerProfile = profileData?.profile || {};
    setFormData((prev) => ({
      ...prev,
      fullName: [profileData?.firstName, profileData?.lastName].filter(Boolean).join(" ") || profile.contactFullName || prev.fullName,
      jobTitle: profile.jobTitle || prev.jobTitle,
      businessEmail: profile.businessEmail || profileData?.email || prev.businessEmail,
      contactNumber: profile.businessPhone || profileData?.contactNumber || profileData?.phone || prev.contactNumber,

      companyName: profile.companyName || prev.companyName,
      legalName: profile.legalBusinessName || prev.legalName,
      dbaName: profile.dbaTradeName || prev.dbaName,
      website: profile.companyWebsiteUrl || prev.website,
      address: profile.businessAddress || profile.streetAddress || prev.address,
      city: profile.city || prev.city,
      state: profile.state || prev.state,
      zipCode: profile.zipCode || prev.zipCode,
      taxId: profile.taxId || prev.taxId,

      portfolioSize: numberToPortfolioSizeLabel(profile.portfolioSize) || prev.portfolioSize,
      maintenance: profile.maintenanceInfrastructure || profile.maintenanceApproach || prev.maintenance,
      propertyTypes: profile.propertyTypes || prev.propertyTypes,
    }));

    const parsedUnits =
      (profile.activeUnits && Number(profile.activeUnits) > 0 ? Number(profile.activeUnits) : 0) ||
      (typeof profile.portfolioSize === "number" && profile.portfolioSize > 0 ? profile.portfolioSize : 0) ||
      portfolioSizeToNumber(profile.portfolioSize || "");

    if (parsedUnits > 0) {
      setSelectedPlan((prev) => {
        const rate = prev.pricePerUnit || 1.0;
        const min = prev.monthlyMinimum || 500;
        return {
          ...prev,
          activeUnits: parsedUnits,
          estimatedTotal: Math.max(parsedUnits * rate, min),
        };
      });
    }

    setIsProfilePreFilled(true);
  }, [profileData, isProfilePreFilled]);

  // Handle role redirect if a service provider visits this route
  useEffect(() => {
    if (!profileData) return;
    if (isServiceProvider) {
      router.replace("/service-provider/verification");
    }
  }, [profileData, isServiceProvider, router]);

  // Load saved state on mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const savedStep = localStorage.getItem("projexpro_verification_step");
      if (savedStep) {
        const parsed = parseInt(savedStep, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 8) {
          setCurrentStep(parsed);
        }
      }
      const savedPlan = localStorage.getItem("projexpro_verification_plan");
      if (savedPlan) {
        try {
          setSelectedPlan(JSON.parse(savedPlan));
        } catch (e) {
          console.error("Error parsing saved plan", e);
        }
      }
    }
  }, []);

  const updateStep = (step: number) => {
    setCurrentStep(step);
    if (typeof window !== "undefined") {
      localStorage.setItem("projexpro_verification_step", String(step));
    }
  };

  // Synchronize verification step based on backend approval and subscription status
  useEffect(() => {
    if (!profileData || !isMounted || isServiceProvider) return;

    // 1. Both approved and subscribed: redirect directly to dashboard
    if (approvalStatus === "approved" && isSubscribed) {
      router.replace("/");
      return;
    }

    // 2. Approved but not subscribed: must select plan and subscribe (Steps 6, 7, 8)
    if (approvalStatus === "approved" && !isSubscribed) {
      if (currentStep < 6) {
        updateStep(6);
      }
      return;
    }

    // 3. Submitted and waiting for admin review: locked to Step 5
    if ((approvalStatus === "pending" || approvalStatus === "resubmitted") && completionPercentage >= 100) {
      if (currentStep !== 5) {
        updateStep(5);
      }
      return;
    }

    // 4. Rejected: show rejection screen on Step 5 unless user is re-editing
    if (approvalStatus === "rejected") {
      if (currentStep !== 2 && currentStep !== 3 && currentStep !== 4) {
        updateStep(5);
      }
      return;
    }
  }, [profileData, approvalStatus, isSubscribed, completionPercentage, isMounted, isServiceProvider, router, currentStep]);

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
      const portfolioSizeNum = portfolioSizeToNumber(formData.portfolioSize);

      const requestBody = {
        firstName,
        lastName,
        phone: formData.contactNumber,
        contactNumber: formData.contactNumber,
        profile: {
          contactFullName: formData.fullName || `${firstName} ${lastName}`.trim(),
          jobTitle: formData.jobTitle || "",
          businessEmail: formData.businessEmail || "",
          businessPhone: formData.contactNumber || "",
          companyName: formData.companyName || "",
          legalBusinessName: formData.legalName || formData.companyName || "",
          dbaTradeName: formData.dbaName || "",
          companyWebsiteUrl: formData.website || "",
          businessAddress: formData.address || "",
          streetAddress: formData.address || "",
          city: formData.city || "",
          state: formData.state || "",
          zipCode: formData.zipCode || "",
          taxId: formData.taxId || "",
          portfolioSize: portfolioSizeNum,
          activeUnits: portfolioSizeNum,
          maintenanceInfrastructure: formData.maintenance || "",
          maintenanceApproach: formData.maintenance || "",
          propertyTypes: formData.propertyTypes || [],
        },
      };

      const res = await updateProfile(requestBody).unwrap();
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

  const handleSelectPlan = (plan: SelectedPlanInfo) => {
    setSelectedPlan(plan);
    if (typeof window !== "undefined") {
      localStorage.setItem("projexpro_verification_plan", JSON.stringify(plan));
    }
    updateStep(8);
  };

  const handlePaymentSuccess = () => {
    toast.success("Payment Successful! ProjexPro Workspace Activated.");
    if (typeof window !== "undefined") {
      localStorage.removeItem("projexpro_verification_step");
      localStorage.removeItem("projexpro_verification_form_data");
      localStorage.removeItem("projexpro_verification_plan");
    }
    refetch();
    router.push("/");
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

  // If approved and subscribed, don't flash verification page while redirecting
  if (approvalStatus === "approved" && isSubscribed) {
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
              isServiceProvider={false}
              onAdminApproved={() => updateStep(6)}
              onResubmit={() => updateStep(2)}
              onRefresh={() => refetch()}
              isRefreshing={isProfileLoading}
            />
          )}
          {currentStep === 6 && (
            <Step6AccountApproved
              contactName={formData.fullName}
              onChoosePlan={() => updateStep(7)}
            />
          )}
          {currentStep === 7 && (
            <Step7ChoosePlan
              portfolioSizeText={formData.portfolioSize}
              activeUnits={
                profileData?.profile?.activeUnits ||
                (typeof profileData?.profile?.portfolioSize === "number"
                  ? profileData.profile.portfolioSize
                  : portfolioSizeToNumber(formData.portfolioSize))
              }
              onSelectPlan={handleSelectPlan}
              onRefresh={() => refetch()}
            />
          )}
          {currentStep === 8 && (
            <Step8BillingActivation
              selectedPlan={selectedPlan}
              contactName={formData.fullName}
              contactEmail={formData.businessEmail}
              billingAddress={formData.address || profileData?.profile?.businessAddress || profileData?.profile?.streetAddress}
              city={formData.city || profileData?.profile?.city}
              state={formData.state || profileData?.profile?.state}
              zipCode={formData.zipCode || profileData?.profile?.zipCode}
              country={profileData?.profile?.country || "United States"}
              onPaymentSuccess={handlePaymentSuccess}
              onBack={() => updateStep(7)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
