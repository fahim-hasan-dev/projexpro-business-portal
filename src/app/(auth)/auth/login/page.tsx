"use client";

import Image from 'next/image';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../../../features/auth/authApi';
import { useMyProfileQuery } from '../../../../features/profile/profileApi';
import { setToken } from '../../../../features/auth/authSlice';
import { getRedirectUrlForProfile } from '../../../../utils/authRedirect';
import AuthHeroSide from '../../../../components/auth/AuthHeroSide';

interface LoginErrors {
  email: string;
  password: string;
}

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

export default function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [errors, setErrors] = useState<LoginErrors>({
    email: '',
    password: ''
  });

  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { refetch: fetchProfile } = useMyProfileQuery(undefined, { skip: true });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e?: FormEvent): Promise<void> => {
    if (e) e.preventDefault();
    const newErrors: LoginErrors = { email: '', password: '' };

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    if (newErrors.email || newErrors.password) {
      return;
    }

    try {
      const res = await login({ email, password }).unwrap();
      if (res?.success || res?.statusCode === 200) {
        const token = res?.data?.accessToken;
        if (token) {
          dispatch(setToken(token));
        }

        toast.success(res?.message || 'Login successful!');

        try {
          const profileRes = await fetchProfile().unwrap();
          const profileData = profileRes?.data || profileRes;
          const redirectUrl = getRedirectUrlForProfile(profileData);
          router.push(redirectUrl);
        } catch {
          const userRole = res?.data?.userInfo?.role;
          const isServiceProvider = userRole === 'service_provider' || userRole === 'provider';
          router.push(isServiceProvider ? '/service-provider/verification' : '/provider-manager/verification');
        }
      } else {
        toast.error(res?.message || 'Login failed.');
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as { status?: number; data?: { statusCode?: number; message?: string }; message?: string };

      const isOtpRequired =
        error?.status === 407 ||
        error?.data?.statusCode === 407 ||
        error?.data?.message?.toLowerCase().includes('otp has been sent');

      if (isOtpRequired) {
        toast.success(error?.data?.message || 'An OTP has been sent. Please verify your email.');
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&type=createAccount`);
        return;
      }

      const errorMessage = error?.data?.message || error?.message || 'Login failed. Please check your credentials and try again.';
      toast.error(errorMessage);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
    if (errors.email) setErrors({ ...errors, email: '' });
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
    if (errors.password) setErrors({ ...errors, password: '' });
  };

  const handleRememberMeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setRememberMe(e.target.checked);
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
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 text-center mt-2 mb-8 font-normal">
            Log in to manage your property operations.
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
                  errors.email ? 'border-red-500' : 'border-gray-200'
                } rounded-[10px] text-gray-900 placeholder:text-gray-400 text-sm focus:bg-white focus:border-[#2E0F59] focus:outline-none focus:ring-1 focus:ring-[#2E0F59] transition-all`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-800 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className={`w-full h-11 px-3.5 pr-10 bg-[#FAFAFB] border ${
                    errors.password ? 'border-red-500' : 'border-gray-200'
                  } rounded-[10px] text-gray-900 placeholder:text-gray-400 text-sm focus:bg-white focus:border-[#2E0F59] focus:outline-none focus:ring-1 focus:ring-[#2E0F59] transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-[#2E0F59] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  className="w-4 h-4 rounded border-gray-300 text-[#2E0F59] focus:ring-[#2E0F59] accent-[#2E0F59] cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs font-normal text-gray-600 cursor-pointer select-none">
                  Remember me
                </label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-[#2E0F59] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Log in Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 h-11 bg-[#2E0F59] hover:bg-[#230945] text-white font-semibold rounded-[10px] shadow-sm transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Logging in...' : 'Log in'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-5">
              <div className="w-full border-t border-gray-200" />
              <span className="absolute bg-white px-3 text-xs text-gray-400 font-normal">
                or
              </span>
            </div>

            {/* Create an account Button */}
            <Link
              href="/auth/register"
              className="w-full h-11 border-2 border-[#2E0F59] hover:bg-purple-50/50 text-[#2E0F59] font-semibold rounded-[10px] transition-all text-sm flex items-center justify-center"
            >
              Create an account
            </Link>
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
