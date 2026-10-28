"use client";

import Image from 'next/image';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { useFindUserNameQuery, useSignupMutation } from '../../../../features/auth/authApi';
import AuthHeroSide from '../../../../components/auth/AuthHeroSide';

type Role = 'manager' | 'provider';

interface RegisterErrors {
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function ProjexProLogo() {
  return (
    <div className="flex items-center justify-center">
      <Image
        src="/logo/logo.png"
        alt="ProjexPro"
        width={578}
        height={515}
        className="w-28 sm:w-32 md:w-[130px] h-auto object-contain"
        priority
      />
    </div>
  );
}

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('manager');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [userName, setuserName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  const router = useRouter();
  const [signup, { isLoading }] = useSignupMutation();

  // Automatic Username availability check query
  const { data: usernameCheckData, isFetching: isCheckingUsername } = useFindUserNameQuery(userName, {
    skip: !userName || userName.trim().length === 0,
  });

  const isUsernameExists =
    usernameCheckData?.data?.exists === true ||
    usernameCheckData?.data?.isAvailable === false ||
    usernameCheckData?.success === false;

  const isUsernameAvailable =
    usernameCheckData?.data?.exists === false &&
    usernameCheckData?.data?.isAvailable === true &&
    usernameCheckData?.success === true;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isPersonalEmail = (email: string): boolean => {
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com',
      'hotmail.com', 'aol.com', 'live.com', 'msn.com',
      'protonmail.com', 'proton.me', 'mail.com', 'yandex.com', 'zoho.com'
    ];
    const domain = email.split('@')[1]?.toLowerCase().trim();
    return personalDomains.includes(domain);
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const newErrors: RegisterErrors = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) {
      newErrors.email = 'Business email address is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (isPersonalEmail(email)) {
      newErrors.email = 'Personal email domains are not accepted. Please use your company email address.';
    }

    if (!userName.trim()) {
      newErrors.userName = 'Username is required';
    } else if (isUsernameExists) {
      newErrors.userName = 'Username is already taken';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        userName: userName.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        role: role === 'manager' ? 'property_manager' : 'service_provider',
      };

      const res = await signup(payload).unwrap();
      if (res?.success || res?.statusCode === 200) {
        toast.success(res?.message || 'User created successfully');
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}&type=createAccount`);
      } else {
        toast.error(res?.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.data?.message || error?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  const isManager = role === 'manager';

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-white overflow-x-hidden lg:overflow-hidden">
      {/* Left Section - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-14 min-h-screen lg:h-screen overflow-y-auto [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Top Spacer */}
        <div className="pt-2" />

        {/* Form Container */}
        <div className="max-w-[440px] w-full mx-auto my-auto py-4">
          {/* Centered Logo */}
          <div className="flex justify-center mb-5">
            <ProjexProLogo />
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 text-center tracking-tight">
            Let's Get Started
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 text-center mt-1.5 mb-5 font-normal">
            Create your ProjexPro Business account.
          </p>

          {/* Role Selection Toggle */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Property Manager Button */}
            <button
              type="button"
              onClick={() => setRole('manager')}
              className={`h-11 rounded-[10px] font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isManager
                  ? 'bg-[#2E0F59] text-white shadow-xs'
                  : 'bg-white border-2 border-[#F5B515] text-[#B45309] hover:bg-amber-50/40'
              }`}
            >
              <span>Property Manager</span>
              {isManager && (
                <span className="w-4 h-4 rounded-full bg-[#F5B515] text-[#2E0F59] flex items-center justify-center text-[10px] font-black">
                  ✓
                </span>
              )}
            </button>

            {/* Service Provider Button */}
            <button
              type="button"
              onClick={() => setRole('provider')}
              className={`h-11 rounded-[10px] font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                !isManager
                  ? 'bg-[#2E0F59] text-white shadow-xs'
                  : 'bg-white border-2 border-[#F5B515] text-[#B45309] hover:bg-amber-50/40'
              }`}
            >
              <span>Service Provider</span>
              {!isManager && (
                <span className="w-4 h-4 rounded-full bg-[#F5B515] text-[#2E0F59] flex items-center justify-center text-[10px] font-black">
                  ✓
                </span>
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* First Name & Last Name (2 Columns) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-xs font-semibold text-gray-800 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors({ ...errors, firstName: '' });
                  }}
                  placeholder="Enter your first name"
                  className={`w-full h-10 px-3.5 bg-[#FAFAFB] border ${
                    errors.firstName ? 'border-red-500' : 'border-gray-200'
                  } rounded-[10px] text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#2E0F59] focus:outline-none focus:ring-1 focus:ring-[#2E0F59] transition-all`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-semibold text-gray-800 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) setErrors({ ...errors, lastName: '' });
                  }}
                  placeholder="Enter your last name"
                  className={`w-full h-10 px-3.5 bg-[#FAFAFB] border ${
                    errors.lastName ? 'border-red-500' : 'border-gray-200'
                  } rounded-[10px] text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#2E0F59] focus:outline-none focus:ring-1 focus:ring-[#2E0F59] transition-all`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Business Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-800 mb-1">
                Business Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="you@company.com"
                className={`w-full h-10 px-3.5 bg-[#FAFAFB] border ${
                  errors.email ? 'border-red-500' : 'border-gray-200'
                } rounded-[10px] text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#2E0F59] focus:outline-none focus:ring-1 focus:ring-[#2E0F59] transition-all`}
              />
              <p className="mt-1 text-[11px] text-gray-400 leading-tight font-normal">
                Use your company email. Personal domains (Gmail, Yahoo, Outlook.com, iCloud, and similar) are not accepted.
              </p>
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Create Username */}
            <div>
              <label htmlFor="userName" className="block text-xs font-semibold text-gray-800 mb-1">
                Create Username
              </label>
              <div className="relative">
                <input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => {
                    setuserName(e.target.value);
                    if (errors.userName) setErrors({ ...errors, userName: '' });
                  }}
                  placeholder="Enter a username"
                  className={`w-full h-10 px-3.5 pr-8 bg-[#FAFAFB] border ${
                    errors.userName || (userName.trim() && isUsernameExists)
                      ? 'border-red-500'
                      : userName.trim() && isUsernameAvailable
                      ? 'border-green-500'
                      : 'border-gray-200'
                  } rounded-[10px] text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#2E0F59] focus:outline-none focus:ring-1 focus:ring-[#2E0F59] transition-all`}
                />
                {isCheckingUsername && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                  </span>
                )}
              </div>
              {errors.userName ? (
                <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.userName}</p>
              ) : userName.trim() && isUsernameExists ? (
                <p className="mt-1 text-[11px] text-red-500 font-medium">Username is already taken</p>
              ) : userName.trim() && isUsernameAvailable ? (
                <p className="mt-1 text-[11px] text-green-600 font-medium">Username is available</p>
              ) : null}
            </div>

            {/* Create Password & Confirm Password (2 Columns) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-gray-800 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    placeholder="Enter password"
                    className={`w-full h-10 px-3.5 pr-8 bg-[#FAFAFB] border ${
                      errors.password ? 'border-red-500' : 'border-gray-200'
                    } rounded-[10px] text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#2E0F59] focus:outline-none focus:ring-1 focus:ring-[#2E0F59] transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#2E0F59] hover:text-[#230945] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-800 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                    placeholder="Confirm password"
                    className={`w-full h-10 px-3.5 pr-8 bg-[#FAFAFB] border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                    } rounded-[10px] text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#2E0F59] focus:outline-none focus:ring-1 focus:ring-[#2E0F59] transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-[#2E0F59] hover:text-[#230945] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isUsernameExists}
              className="w-full mt-3 h-11 bg-[#2E0F59] hover:bg-[#230945] text-white font-semibold rounded-[10px] shadow-sm transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Creating Account...' : 'Create Business Account'}</span>
            </button>

            {/* Log in Link */}
            <div className="text-center text-xs text-gray-500 pt-2">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-bold text-[#2E0F59] hover:underline">
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
