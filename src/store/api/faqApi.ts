import { api } from './baseApi';

export interface FAQItem {
  question: string;
  answer: string;
  order: number;
  _id?: string; // Optional, may not be in response
}

export interface FAQResponse {
  success: boolean;
  message: string;
  data: {
    faqs: FAQItem[];
  };
}

export const faqApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get General FAQs (FAQ1.md)
    getFaqs: builder.query<FAQItem[], void>({
      query: () => 'faq',
      transformResponse: (response: FAQResponse) =>
        response.data.faqs.sort((a, b) => a.order - b.order),
    }),
    // Get Competition FAQs (FAQ2.md)
    getCompetitionFAQs: builder.query<FAQItem[], string>({
      query: (competitionId) => `competitions/${competitionId}/faq`, // Note: /faq not /faqs
      transformResponse: (response: FAQResponse) =>
        response.data.faqs.sort((a, b) => a.order - b.order),
    }),
  }),
});

export const { useGetFaqsQuery, useGetCompetitionFAQsQuery } = faqApi;
