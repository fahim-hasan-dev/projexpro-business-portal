import { baseApi } from "../../utils/apiBaseQuery";
import {
  IInvoice,
  IInvoicesResponse,
  IGetInvoicesParams,
  IPayInvoiceResponse,
} from "@/types/invoice";

export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all invoices for the logged-in Property Manager
    getMyInvoices: builder.query<
      { statusCode: number; success: boolean; message: string; data: IInvoicesResponse },
      IGetInvoicesParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.searchTerm) queryParams.append("searchTerm", params.searchTerm);
        if (params?.status && params.status !== "all") queryParams.append("status", params.status);
        if (params?.page) queryParams.append("page", String(params.page));
        if (params?.limit) queryParams.append("limit", String(params.limit));
        if (params?.sort) queryParams.append("sort", params.sort);

        const queryString = queryParams.toString();
        return {
          url: `/invoice/my-invoices${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Invoice"],
    }),

    // Get single invoice by ID
    getSingleInvoice: builder.query<
      { statusCode: number; success: boolean; message: string; data: IInvoice },
      string
    >({
      query: (id) => ({
        url: `/invoice/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Invoice", id }],
    }),

    // Get invoice by Service Request ID
    getInvoiceByServiceRequest: builder.query<
      { statusCode: number; success: boolean; message: string; data: IInvoice },
      string
    >({
      query: (serviceRequestId) => ({
        url: `/invoice/service-request/${serviceRequestId}`,
        method: "GET",
      }),
      providesTags: (result, error, serviceRequestId) => [{ type: "Invoice", id: serviceRequestId }],
    }),

    // Pay Invoice via Stripe (Creates Stripe Checkout Session and returns checkoutUrl)
    payInvoice: builder.mutation<
      { statusCode: number; success: boolean; message: string; data: IPayInvoiceResponse },
      string
    >({
      query: (id) => ({
        url: `/invoice/${id}/pay`,
        method: "POST",
      }),
      invalidatesTags: ["Invoice", "ServiceRequest", "Payment"],
    }),

    // Pay Invoice directly by Service Request ID
    payInvoiceByServiceRequest: builder.mutation<
      { statusCode: number; success: boolean; message: string; data: IPayInvoiceResponse },
      string
    >({
      query: (serviceRequestId) => ({
        url: `/invoice/service-request/${serviceRequestId}/pay`,
        method: "POST",
      }),
      invalidatesTags: ["Invoice", "ServiceRequest", "Payment"],
    }),

    // Generate Invoice for a completed Service Request
    createInvoice: builder.mutation<
      { statusCode: number; success: boolean; message: string; data: IInvoice },
      { serviceRequestId: string }
    >({
      query: (body) => ({
        url: "/invoice/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invoice", "ServiceRequest"],
    }),
  }),
});

export const {
  useGetMyInvoicesQuery,
  useGetSingleInvoiceQuery,
  useGetInvoiceByServiceRequestQuery,
  usePayInvoiceMutation,
  usePayInvoiceByServiceRequestMutation,
  useCreateInvoiceMutation,
} = invoiceApi;
