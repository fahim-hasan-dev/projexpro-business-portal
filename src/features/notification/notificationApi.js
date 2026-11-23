import { baseApi } from "../../utils/apiBaseQuery";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnreadNotificationCount: builder.query({
      query: () => ({
        url: "/notification/unread-count",
        method: "GET",
      }),
      providesTags: ["Notification"],
    }),
  }),
});

export const { useGetUnreadNotificationCountQuery } = notificationApi;
