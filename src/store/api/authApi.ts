import { api } from './baseApi';
import { User, AuthResponse } from '../types';

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
  };
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data?: {
    verified?: boolean;
  };
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data?: {
    message?: string;
    resetToken?: string;
  };
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    registerUser: builder.mutation<AuthResponse, Partial<User>>({
      query: ({ firstName, lastName, email, password }) => ({
        url: 'auth/register',
        method: 'POST',
        body: {
          name: `${firstName} ${lastName}`,
          email,
          password,
        },
      }),
    }),
    loginUser: builder.mutation<AuthResponse, Partial<User>>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    refreshToken: builder.mutation<RefreshTokenResponse, { refreshToken: string }>({
      query: (body) => ({
        url: 'auth/refresh',
        method: 'POST',
        body,
      }),
    }),
    verifyOtp: builder.mutation<VerifyOtpResponse, { otp: string; email: string }>({
      query: (body) => ({
        url: 'auth/verify-otp',
        method: 'POST',
        body,
      }),
    }),
    forgotPassword: builder.mutation<ForgotPasswordResponse, { email: string }>({
      query: (body) => ({
        url: 'auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<ResetPasswordResponse, { token: string; password: string }>({
      query: (body) => ({
        url: 'auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    logoutUser: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Cart', 'Profile'],
    }),
    getMe: builder.query<User, void>({
      query: () => 'user/profile',
      transformResponse: (response: { data: { user: User } }) => response.data.user,
    }),
  }),
});

export const { 
  useRegisterUserMutation, 
  useLoginUserMutation, 
  useRefreshTokenMutation,
  useVerifyOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutUserMutation, 
  useGetMeQuery 
} = authApi;
