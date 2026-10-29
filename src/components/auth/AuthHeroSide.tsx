"use client";

import Image from "next/image";
import React from "react";

export default function AuthHeroSide() {
  return (
    <div className="hidden lg:flex lg:w-1/2 sticky top-0 h-screen flex-shrink-0 relative flex-col justify-end p-12 lg:p-16 xl:p-20 overflow-hidden bg-[#1F0B43]">
      {/* Background Image - Left aligned to match reference design framing */}
      <Image
        src="/images/onbording.jpg"
        alt="Property Operations"
        fill
        className="object-cover object-left"
        priority
      />

      {/* Deep Purple Gradient Overlay matching reference image exactly */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(31, 11, 67, 0.15) 0%, rgba(31, 11, 67, 0.25) 25%, rgba(31, 11, 67, 0.52) 48%, rgba(31, 11, 67, 0.80) 72%, rgba(29, 9, 63, 0.94) 88%, #1F0B43 100%)",
        }}
      />

      {/* Hero Content */}
      <div className="relative z-10 max-w-xl pb-2">
        <h2 className="text-4xl lg:text-5xl xl:text-[50px] font-extrabold text-white tracking-tight leading-[1.12]">
          Property Operations.
        </h2>
        <h2 className="text-4xl lg:text-5xl xl:text-[50px] font-extrabold text-[#F5B515] tracking-tight leading-[1.12] mt-1">
          Automated.
        </h2>

        {/* Accent Yellow Bar */}
        <div className="w-14 h-1.5 bg-[#F5B515] rounded-full my-5" />

        {/* Subtitles */}
        <p className="text-lg lg:text-xl font-medium text-white/95">
          Keep your software.
        </p>
        <p className="text-base lg:text-lg font-normal text-gray-200 mt-1">
          Add the tools, the team, the platform.
        </p>
      </div>
    </div>
  );
}
