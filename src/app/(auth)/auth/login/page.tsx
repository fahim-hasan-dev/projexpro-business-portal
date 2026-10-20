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

interface LoginErrors {
  email: string;
  password: string;
}

function ProjexProLogo() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo/logo.png"
        alt="ProjexPro Logo"
        width={220}
        height={60}
        className="h-14 w-auto object-contain"
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
      newErrors.email = 'Business email address is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    // If there are errors, don't submit
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

        // Check profile completion status for role-based onboarding redirection
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
    } catch (error: any) {
      console.error(error);
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
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#EBEBEB] overflow-x-hidden lg:overflow-hidden">
      {/* Left Section - Form */}
      <div className="w-full lg:w-[50%] xl:w-[50%] flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-14 min-h-screen lg:h-screen overflow-y-auto [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Logo */}
        <div className="mt-14 max-w-lg w-full mx-auto">
          <ProjexProLogo />
        </div>

        {/* Form Container */}
        <div className="max-w-lg w-full mx-auto my-auto py-2">
          <h1 className="text-2xl sm:text-3xl lg:text-[30px] font-bold text-gray-900 tracking-tight leading-snug">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mt-2 mb-8 font-normal">
            Sign in to access your ProjexPro workspace.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Business Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@company.com"
                className={`w-full px-4 py-3.5 bg-[#E2E2E5] border ${errors.email ? 'border-red-500' : 'border-transparent'
                  } rounded-lg text-gray-900 placeholder:text-gray-400 text-sm focus:bg-white focus:border-primary focus:outline-none transition-all`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password..."
                  className={`w-full px-4 py-3.5 bg-[#E2E2E5] border ${errors.password ? 'border-red-500' : 'border-transparent'
                    } rounded-lg text-gray-900 placeholder:text-gray-400 text-sm focus:bg-white focus:border-primary focus:outline-none transition-all pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-primary hover:opacity-80 transition-opacity"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Forget Password */}
            <div className="flex justify-end pt-0.5">
              <Link
                href="/auth/forgot-password"
                className="text-xs sm:text-sm font-medium text-[#E53935] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Remember Me */}
            {/* <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                className="w-4 h-4 rounded border-gray-400 text-primary focus:ring-primary accent-[#6B1294] cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                Remember this device
              </label>
            </div> */}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-[#6B1294] hover:bg-[#580e7d] text-white font-semibold py-3.5 px-4 rounded-lg shadow-sm transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            </button>

            {/* Create Account Link */}
            <div className="text-center mt-6 pt-2 text-sm text-gray-700 font-medium">
              New to ProjexPro?{' '}
              <Link href="/auth/register" className="text-[#6B1294] font-semibold hover:underline">
                Create Business Account.
              </Link>
            </div>
          </form>
        </div>

        {/* Bottom Spacer for Alignment */}
        <div className="hidden lg:block"></div>
      </div>

      {/* Right Section - Hero Image & Heading */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[50%] sticky top-0 h-screen flex-shrink-0 relative flex-col justify-start p-12 lg:p-16 xl:p-20 overflow-hidden bg-gray-300">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 scale-105"
          style={{ backgroundImage: `url('/images/login.png')` }}
        />

        {/* Text Content Overlay */}
        <div className="relative z-10 text-white pt-4 max-w-xl">
          <h2 className="text-3xl lg:text-4xl xl:text-[42px] font-medium leading-[1.2] tracking-tight drop-shadow-md mb-6 uppercase">
            THE SMARTER WAY TO MANAGE PROPERTY OPERATIONS.
          </h2>
          <p className="text-base xl:text-lg font-normal text-gray-200 leading-relaxed tracking-normal">
            Coordinate work orders, vendors, documentation, real-time project tracking, and portfolio activity from one connected platform.
          </p>
        </div>
      </div>
    </div>
  );
}
