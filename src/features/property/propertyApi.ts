import { baseApi } from "../../utils/apiBaseQuery";
import {
  IProperty,
  IPropertiesResponse,
  IGetPropertiesParams,
  IPropertyCategory,
} from "@/types/property";

export const propertyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all properties belonging to the logged-in Property Manager
    getMyProperties: builder.query<
      { statusCode: number; success: boolean; message: string; data: IPropertiesResponse },
      IGetPropertiesParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.searchTerm) queryParams.append("searchTerm", params.searchTerm);
        if (params?.page) queryParams.append("page", String(params.page));
        if (params?.limit) queryParams.append("limit", String(params.limit));
        if (params?.status && params.status !== "all") queryParams.append("status", params.status);
        if (params?.category) queryParams.append("category", params.category);
        if (params?.subCategory) queryParams.append("subCategory", params.subCategory);

        const queryString = queryParams.toString();
        return {
          url: `/property/my-properties${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Property"],
    }),

    // Get all properties (for general listing / admin)
    getAllProperties: builder.query<
      { statusCode: number; success: boolean; message: string; data: IPropertiesResponse },
      IGetPropertiesParams | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.searchTerm) queryParams.append("searchTerm", params.searchTerm);
        if (params?.page) queryParams.append("page", String(params.page));
        if (params?.limit) queryParams.append("limit", String(params.limit));
        if (params?.status) queryParams.append("status", params.status);

        const queryString = queryParams.toString();
        return {
          url: `/property${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Property"],
    }),

    // Get single property by ID
    getSingleProperty: builder.query<
      { statusCode: number; success: boolean; message: string; data: IProperty },
      string
    >({
      query: (id) => ({
        url: `/property/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Property", id }],
    }),

    // Create a new property
    createProperty: builder.mutation<
      { statusCode: number; success: boolean; message: string; data: IProperty },
      FormData | Record<string, any>
    >({
      query: (body) => ({
        url: "/property/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Property", "Profile"],
    }),

    // Update an existing property
    updateProperty: builder.mutation<
      { statusCode: number; success: boolean; message: string; data: IProperty },
      { id: string; data: FormData | Record<string, any> }
    >({
      query: ({ id, data }) => ({
        url: `/property/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Property", "Profile"],
    }),

    // Delete property (Soft delete)
    deleteProperty: builder.mutation<
      { statusCode: number; success: boolean; message: string; data: IProperty },
      string
    >({
      query: (id) => ({
        url: `/property/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Property", "Profile"],
    }),

    // Get top-level parent categories (Residential, Commercial, Mixed-use)
    getCategories: builder.query<
      { statusCode: number; success: boolean; message: string; data: { categories: IPropertyCategory[]; totalCategories: number } },
      void
    >({
      query: () => ({
        url: "/category",
        method: "GET",
      }),
      providesTags: ["Category"],
    }),

    // Get sub-categories by parent category ID
    getSubCategories: builder.query<
      {
        statusCode: number;
        success: boolean;
        message: string;
        data: {
          parentCategory: IPropertyCategory;
          subCategories: IPropertyCategory[];
        };
      },
      string
    >({
      query: (parentId) => ({
        url: `/category/sub-categories/${parentId}`,
        method: "GET",
      }),
      providesTags: (result, error, parentId) => [{ type: "Category", id: parentId }],
    }),
  }),
});

export const {
  useGetMyPropertiesQuery,
  useGetAllPropertiesQuery,
  useGetSinglePropertyQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
} = propertyApi;
