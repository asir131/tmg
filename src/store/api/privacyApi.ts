import { api } from './baseApi';

export interface PrivacyPolicy {
  title: string;
  content: string;
  version: number;
  updatedAt: string;
}

export interface PrivacyPolicyResponse {
  success: boolean;
  message: string;
  data: {
    title: string;
    content: string;
    version: number;
    updatedAt: string;
  };
}

export interface PrivacySection {
  id: string;
  title: string;
  content?: string;
  order: number;
  updatedAt?: string;
}

export interface PrivacySectionsResponse {
  success: boolean;
  message: string;
  data: {
    sections: PrivacySection[];
  };
}

export interface PrivacySectionResponse {
  success: boolean;
  message: string;
  data: {
    section: PrivacySection;
  };
}

export interface PrivacyPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    sections: PrivacySection[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}

export const privacyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get Privacy Policy (single document)
    getPrivacyPolicy: builder.query<PrivacyPolicy, void>({
      query: () => 'privacy',
      transformResponse: (response: PrivacyPolicyResponse) => response.data,
    }),
    // Get all sections (lightweight - titles only)
    getPrivacySections: builder.query<PrivacySection[], void>({
      query: () => 'privacy/sections',
      transformResponse: (response: PrivacySectionsResponse) =>
        response.data.sections.sort((a, b) => a.order - b.order),
    }),
    // Get paginated sections
    getPrivacySectionsPaginated: builder.query<
      PrivacyPaginatedResponse['data'],
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 }) =>
        `privacy/sections/paginated?page=${page}&limit=${limit}`,
      transformResponse: (response: PrivacyPaginatedResponse) => response.data,
    }),
    // Get single section by ID
    getPrivacySectionById: builder.query<PrivacySection, string>({
      query: (id) => `privacy/sections/${id}`,
      transformResponse: (response: PrivacySectionResponse) => response.data.section,
    }),
  }),
});

export const {
  useGetPrivacyPolicyQuery,
  useGetPrivacySectionsQuery,
  useGetPrivacySectionsPaginatedQuery,
  useGetPrivacySectionByIdQuery,
} = privacyApi;
