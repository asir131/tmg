import { api } from './baseApi';

export interface PostalEntryInstruction {
  _id: string;
  title: string;
  instructions: string;
  postal_address: string;
  deadline: string;
  entry_fee: number;
  is_active: boolean;
}

export interface PostalEntryResponse {
  success: boolean;
  message: string;
  data: {
    postalEntry: PostalEntryInstruction;
  };
}

export const postalEntryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPostalEntry: builder.query<PostalEntryInstruction | null, string>({
      query: (competitionId) => `competitions/${competitionId}/postal-entry`,
      transformResponse: (response: PostalEntryResponse) => response.data.postalEntry,
      // 404 errors will be handled in components - they indicate no postal entry exists
    }),
  }),
});

export const { useGetPostalEntryQuery } = postalEntryApi;

