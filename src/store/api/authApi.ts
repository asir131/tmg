import { api } from './baseApi';
import { User, AuthResponse } from '../types';

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
    getMe: builder.query<User, void>({
      query: () => 'auth/me',
      transformResponse: (response: { data: { user: User } }) => response.data.user,
    }),
  }),
});

export const { useRegisterUserMutation, useLoginUserMutation, useGetMeQuery } = authApi;
