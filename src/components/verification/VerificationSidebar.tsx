"use client";

import React from "react";
import { Check, Shield } from "lucide-react";

interface VerificationSidebarProps {
  currentStep: number;
  isServiceProvider?: boolean;
}

export default function VerificationSidebar({
  currentStep,
  isServiceProvider = false,
}: VerificationSidebarProps) {
  const stepsList = [
    { number: 1, title: "Welcome", desc: "Account created" },
    { number: 2, title: "Company Profile", desc: "Organization details" },
    {
      number: 3,
      title: isServiceProvider ? "Provider & Business" : "Portfolio Profile",
      desc: isServiceProvider ? "Licenses, services & business" : "Portfolio & operating details",
    },
    { number: 4, title: "Review & Submit", desc: "Submit for verification" },
  ];

  return (
    <div className="w-full md:w-80 lg:w-[370px] bg-[#5B1B95] text-white p-6 md:p-8 flex flex-col justify-between shrink-0 relative overflow-hidden min-h-[640px]">
      {/* Decorative Circles */}
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />

      <div className="space-y-8 relative z-10">

        {currentStep === 5 ? (
          <div className="mt-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-purple-900/60 border border-purple-400/40 flex items-center justify-center">
              <Shield className="w-8 h-8 text-purple-200" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {isServiceProvider ? "Service Provider Verification" : "Property Partner Verification"}
            </h2>
            <p className="text-xs text-purple-200/80 leading-relaxed font-normal">
              Your application is being reviewed by the platform administrator.
            </p>
          </div>
        ) : (
          <>
            {/* Section Title */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-200/90">
                ACCOUNT VERIFICATION
              </h3>
            </div>

            {/* Steps Timeline List */}
            <div className="space-y-7 relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-purple-400/30 -z-0" />

              {stepsList.map((st) => {
                const isCompleted = currentStep > st.number;
                const isCurrent = currentStep === st.number;

                return (
                  <div key={st.number} className="flex items-start gap-3.5 relative z-10">
                    {/* Step Circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${isCompleted
                          ? "bg-emerald-500 text-white shadow-xs"
                          : isCurrent
                            ? "bg-white text-[#5B1B95] font-medium ring-4 ring-purple-300/30 shadow-sm"
                            : "bg-purple-900/50 text-purple-200 border border-purple-400/40"
                        }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      ) : (
                        st.number
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="pt-0.5">
                      <h4
                        className={`text-sm font-bold leading-tight ${isCurrent
                            ? "text-white"
                            : isCompleted
                              ? "text-purple-200"
                              : "text-purple-200/70"
                          }`}
                      >
                        {st.title}
                      </h4>
                      <p
                        className={`text-xs mt-0.5 font-normal ${isCurrent
                            ? "text-purple-100/90 font-medium"
                            : "text-purple-200/60"
                          }`}
                      >
                        {st.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer info at bottom left */}
      <div className="pt-12 text-[11px] text-purple-200/70 font-medium relative z-10">
        Property Services. Simplified.
      </div>
    </div>
  );
}
