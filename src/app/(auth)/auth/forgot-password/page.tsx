"use client";

import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { useForgotEmailMutation } from '../../../../features/auth/authApi';
import AuthHeroSide from '../../../../components/auth/AuthHeroSide';

function ProjexProLogo() {
  return (
    <div className="flex items-center justify-center">
      <Image
        src="/logo/logo.png"
        alt="ProjexPro"
        width={578}
        height={515}
        className="w-32 sm:w-36 md:w-[145px] h-auto object-contain"
        priority
      />
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');

  const router = useRouter();
  const [forgotEmail, { isLoading }] = useForgotEmailMutation();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const res = await forgotEmail({ email }).unwrap();
      if (res?.success || res?.statusCode === 200) {
        toast.success(res?.message || 'OTP sent successfully. Please check your email.');
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&type=resetPassword`);
      } else {
        toast.error(res?.message || 'Failed to send OTP.');
      }
    } catch (err: unknown) {
      console.error(err);
      const errorObj = err as { data?: { message?: string }; message?: string };
      const errorMessage = errorObj?.data?.message || errorObj?.message || 'Failed to send reset link. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-white overflow-x-hidden lg:overflow-hidden">
      {/* Left Section - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-14 min-h-screen lg:h-screen overflow-y-auto [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Top Spacer */}
        <div className="pt-2 sm:pt-4" />

        {/* Form Container */}
        <div className="max-w-[400px] w-full mx-auto my-auto py-6">
          {/* Centered Logo */}
          <div className="flex justify-center mb-6">
            <ProjexProLogo />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 text-center tracking-tight">
            Forgot Password
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 text-center mt-2 mb-8 font-normal">
            Enter your email address and we&apos;ll send you an OTP code to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-800 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@company.com"
                className={`w-full h-11 px-3.5 bg-[#FAFAFB] border ${
                  error ? 'border-red-500' : 'border-gray-200'
                } rounded-[10px] text-gray-900 placeholder:text-gray-400 text-sm focus:bg-white focus:border-[#2E0F59] focus:outline-none focus:ring-1 focus:ring-[#2E0F59] transition-all`}
              />
              {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
            </div>

            {/* Send Code Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-11 bg-[#2E0F59] hover:bg-[#230945] text-white font-semibold rounded-[10px] shadow-sm transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Sending Code...' : 'Send Reset OTP'}</span>
            </button>

            {/* Return to Sign In Link */}
            <div className="text-center pt-3">
              <span className="text-xs text-gray-500">Remember your password? </span>
              <Link
                href="/auth/login"
                className="text-xs font-bold text-[#2E0F59] hover:underline"
              >
                Log in
              </Link>
            </div>
          </form>
        </div>

        {/* Footer Copyright */}
        <div className="text-center text-xs text-gray-400 py-3">
          © 2026 ProjexPro. All rights reserved.
        </div>
      </div>

      {/* Right Section - Onboarding Hero */}
      <AuthHeroSide />
    </div>
  );
}