import { api } from './baseApi';

export interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  order: number;
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
    getFaqs: builder.query<FAQItem[], void>({
      query: () => 'faq',
      transformResponse: (response: FAQResponse) =>
        response.data.faqs.sort((a, b) => a.order - b.order),
    }),
  }),
});

export const { useGetFaqsQuery } = faqApi;
