import { api } from './baseApi';

export interface TermsSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface TermsResponse {
  success: boolean;
  message: string;
  data: {
    sections: TermsSection[];
  };
}

export const termsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTerms: builder.query<TermsSection[], void>({
      query: () => 'terms',
      transformResponse: (response: TermsResponse) =>
        response.data.sections.sort((a, b) => a.order - b.order),
    }),
  }),
});

export const { useGetTermsQuery } = termsApi;
