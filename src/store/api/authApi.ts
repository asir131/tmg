import { api } from './baseApi';
import { User, AuthResponse } from '../types';

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
  };
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
  useLogoutUserMutation, 
  useGetMeQuery 
} = authApi;
