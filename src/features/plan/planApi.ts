import { baseApi } from "../../utils/apiBaseQuery";
import { IBackendPlan, IEnterpriseRequestResponse } from "../../types/plan";

export const planApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all active plans from backend
    getPlans: builder.query<{ success: boolean; message: string; data: { plans: IBackendPlan[] } }, void>({
      query: () => ({
        url: "/plan",
        method: "GET",
      }),
      providesTags: ["Plan"],
    }),

    // Create Stripe Checkout Session for Prime and Pro plans
    createCheckoutSession: builder.mutation<{ url: string }, string>({
      query: (planId) => ({
        url: `/plan/create-checkout-session/${planId}`,
        method: "POST",
      }),
    }),

    // Submit Custom Enterprise Request for Enterprise plans
    createEnterpriseRequest: builder.mutation<IEnterpriseRequestResponse, { planId: string }>({
      query: (body) => ({
        url: "/subscription/enterprise/request",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Profile", "Subscription"],
    }),

    // Fetch user current active subscription details
    getMySubscription: builder.query<{ success: boolean; data: any }, void>({
      query: () => ({
        url: "/subscription/my-plan",
        method: "GET",
      }),
      providesTags: ["Subscription"],
    }),

    // Generate Stripe Customer Billing Portal Session
    createBillingPortal: builder.mutation<{ success: boolean; data: { url: string } }, void>({
      query: () => ({
        url: "/subscription/billing-portal",
        method: "POST",
      }),
    }),

    // Cancel Active Subscription
    cancelSubscription: builder.mutation<
      { success: boolean; message: string; data: any },
      { cancelImmediately?: boolean } | void
    >({
      query: (body) => ({
        url: "/subscription/cancel",
        method: "POST",
        body: body || { cancelImmediately: false },
      }),
      invalidatesTags: ["Subscription", "Profile"],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useCreateCheckoutSessionMutation,
  useCreateEnterpriseRequestMutation,
  useGetMySubscriptionQuery,
  useCreateBillingPortalMutation,
  useCancelSubscriptionMutation,
} = planApi;
