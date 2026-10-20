import { baseApi } from "../../utils/apiBaseQuery";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Signup
    signup: builder.mutation({
      query: (credentials) => ({
        url: "/auth/signup",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Forgot Password Email
    forgotEmail: builder.mutation({
      query: (forgotEmail) => ({
        url: "/auth/forget-password",
        method: "POST",
        body: forgotEmail,
      }), 
      invalidatesTags: ["Auth"],
    }),

    // OTP Verification (Handles both signup & forgot password OTP verification)
    otpCheck: builder.mutation({
      query: (data) => ({
        url: "/auth/verify-account",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Resend OTP
    resendOTP: builder.mutation({
      query: (data) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Reset Password
    resetPassword: builder.mutation({
      query: ({ token, newPassword, confirmPassword }) => ({
        url: `/auth/reset-password${token ? `?token=${token}` : ""}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: {
          newPassword,
          confirmPassword,
        },
      }),
      invalidatesTags: ["Auth"],
    }),


    findUserName: builder.query({
      query: (userName) => ({
        url: `/user/check-username?username=${userName}`,
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),

    // Change Password
    changePassword: builder.mutation({
      query: (data) => ({
        url: "/auth/change-password",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

// Export hooks
export const {
  useLoginMutation,
  useSignupMutation,
  useForgotEmailMutation,
  useOtpCheckMutation,
  useResendOTPMutation,
  useResetPasswordMutation,
  useFindUserNameQuery,
  useChangePasswordMutation,
} = authApi;

