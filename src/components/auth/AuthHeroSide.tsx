"use client";

import Image from "next/image";
import React from "react";

export default function AuthHeroSide() {
  return (
    <div className="hidden lg:flex lg:w-1/2 sticky top-0 h-screen flex-shrink-0 relative flex-col justify-end p-12 lg:p-16 xl:p-20 overflow-hidden bg-[#1B0633]">
      {/* Background Image */}
      <Image
        src="/images/onbording.jpg"
        alt="Property Operations"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Deep Purple Gradient Overlay matching reference image */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1b0633] via-[#220a3e]/80 via-45% to-transparent pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-xl pb-2">
        <h2 className="text-4xl lg:text-5xl xl:text-[50px] font-extrabold text-white tracking-tight leading-[1.12]">
          Property Operations.
        </h2>
        <h2 className="text-4xl lg:text-5xl xl:text-[50px] font-extrabold text-[#F5B515] tracking-tight leading-[1.12] mt-1">
          Automated.
        </h2>

        {/* Accent Yellow Bar */}
        <div className="w-16 h-1.5 bg-[#F5B515] rounded-full my-6" />

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
