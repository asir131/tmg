import { api } from './baseApi';
import { User } from '../types';

type ProfileUser = User & {
  _id?: string;
  profile_image?: string | null;
  phone_number?: string | null;
  location?: string | null;
  total_points?: number;
  total_earned?: number;
  total_spent?: number;
  total_redeemed?: number;
  userStatus?: string;
};

type PointsSummary = {
  total_points: number;
  total_earned: number;
  total_spent: number;
  total_redeemed: number;
};

export interface PointsHistoryEntry {
  _id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  createdAt: string;
  updatedAt: string;
}

export interface PointsHistoryResponse {
  success: boolean;
  message: string;
  data: {
    history?: PointsHistoryEntry[];
    points_history?: PointsHistoryEntry[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface PurchaseHistoryItem {
  _id: string;
  competition: {
    _id: string;
    title: string;
    slug: string;
    image_url: string;
  };
  tickets: number;
  amount: number;
  date: string;
  status: string;
  payment_intent_id?: string | null;
  transaction_id?: string | null;
}

export interface PurchaseHistoryResponse {
  success: boolean;
  message: string;
  data: {
    purchase_history: PurchaseHistoryItem[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ProfileUser, void>({
      query: () => 'user/profile',
      transformResponse: (response: { data: { user: ProfileUser } }) => ({
        ...response.data.user,
        id: response.data.user.id ?? response.data.user._id,
      }),
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<ProfileUser, Partial<ProfileUser>>({
      query: (body) => ({
        url: 'user/profile',
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { data: { user: ProfileUser } }) => ({
        ...response.data.user,
        id: response.data.user.id ?? response.data.user._id,
      }),
      invalidatesTags: ['Profile'],
    }),
    getPointsSummary: builder.query<PointsSummary, void>({
      query: () => 'user/points/summary',
      transformResponse: (response: { data: { summary: PointsSummary } }) => response.data.summary,
      providesTags: ['Profile'],
    }),
    getPointsHistory: builder.query<PointsHistoryResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => `user/points/history?page=${page}&limit=${limit}`,
      
      providesTags: ['Profile'],
    }),
    getPurchaseHistory: builder.query<PurchaseHistoryResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => `user/profile/purchase-history?page=${page}&limit=${limit}`,
      providesTags: ['Profile'],
    }),
    redeemPoints: builder.mutation<
      {
        success: boolean;
        message: string;
        data?: {
          summary?: PointsSummary;
          redeemed_amount?: number;
          remaining_points?: number;
          total_redeemed?: number;
        }
      },
      { amount: number }
    >({
      query: (body) => ({
        url: 'user/points/redeem',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetPointsSummaryQuery,
  useGetPointsHistoryQuery,
  useGetPurchaseHistoryQuery,
  useRedeemPointsMutation,
} = profileApi;
