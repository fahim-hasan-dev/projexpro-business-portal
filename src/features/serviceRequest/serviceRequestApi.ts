import { baseApi } from "../../utils/apiBaseQuery";
import {
  IServiceRequest,
  IServiceRequestsResponse,
  IGetServiceRequestsParams,
  ICreateServiceRequestPayload,
  IUpdateServiceRequestStatusPayload,
} from "@/types/serviceRequest";

export const serviceRequestApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all service requests (role-based: PM sees own, Provider sees assigned, Admin sees all)
    getAllServiceRequests: builder.query<
      { statusCode: number; success: boolean; message: string; data: IServiceRequestsResponse },
      IGetServiceRequestsParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.searchTerm) queryParams.append("searchTerm", params.searchTerm);
        if (params?.status && params.status !== "all") queryParams.append("status", params.status);
        if (params?.priority && params.priority !== "all") queryParams.append("priority", params.priority);
        if (params?.page) queryParams.append("page", String(params.page));
        if (params?.limit) queryParams.append("limit", String(params.limit));
        if (params?.sort) queryParams.append("sort", params.sort);

        const queryString = queryParams.toString();
        return {
          url: `/service-request${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["ServiceRequest"],
    }),

    // Get single service request by ID
    getSingleServiceRequest: builder.query<
      { statusCode: number; success: boolean; message: string; data: IServiceRequest },
      string
    >({
      query: (id) => ({
        url: `/service-request/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "ServiceRequest", id }],
    }),

    // Create a new service request (Property Manager only)
    createServiceRequest: builder.mutation<
      { statusCode: number; success: boolean; message: string; data: IServiceRequest },
      FormData | ICreateServiceRequestPayload
    >({
      query: (body) => ({
        url: "/service-request/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ServiceRequest"],
    }),

    // Update status (e.g. Accept, Reject, In Progress, Pending Approval, Completed, Cancelled)
    updateServiceRequestStatus: builder.mutation<
      { statusCode: number; success: boolean; message: string; data: IServiceRequest },
      { id: string; data: FormData | IUpdateServiceRequestStatusPayload }
    >({
      query: ({ id, data }) => ({
        url: `/service-request/status/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ServiceRequest"],
    }),

    // Delete service request (Soft delete)
    deleteServiceRequest: builder.mutation<
      { statusCode: number; success: boolean; message: string; data: IServiceRequest },
      string
    >({
      query: (id) => ({
        url: `/service-request/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ServiceRequest"],
    }),
  }),
});

export const {
  useGetAllServiceRequestsQuery,
  useGetSingleServiceRequestQuery,
  useCreateServiceRequestMutation,
  useUpdateServiceRequestStatusMutation,
  useDeleteServiceRequestMutation,
} = serviceRequestApi;
