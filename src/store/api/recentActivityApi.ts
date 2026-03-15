import { api } from './baseApi';

export interface RecentPurchase {
  first_name: string;
  ticket_count: number;
  minutes_ago: number;
}

export interface RecentActivityResponse {
  success: boolean;
  message: string;
  data: {
    recent_purchases: RecentPurchase[];
    tickets_in_last_minutes: number;
    last_minutes: number;
  };
}

export const recentActivityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRecentActivity: builder.query<RecentActivityResponse['data'], void>({
      query: () => 'recent-activity',
      transformResponse: (response: RecentActivityResponse) => response.data,
      pollingInterval: 45000,
    }),
  }),
});

export const { useGetRecentActivityQuery } = recentActivityApi;
