import { api } from './baseApi';
import { CompetitionsResponse, CompetitionDetailsResponse } from '../types';

export interface MyCompetitionEntry {
  _id: string;
  title: string;
  image_url: string;
  draw_time: string;
  createdAt: string;
  status: string;
  total_purchased_tickets?: number;
  total_participated_competitions?: number;
}

export interface MyCompetitionsResponse {
  success: boolean;
  message: string;
  data: {
    total_participated_competitions: number;
    total_purchased_tickets: number;
    competitions: MyCompetitionEntry[];
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

export interface CompetitionTicketsResponse {
  success: boolean;
  message: string;
  data: {
    tickets: {
      ticket_number: string;
      username: string;
      date_time: string;
    }[];
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

export interface ResultsResponse {
  success: boolean;
  message: string;
  data: {
    results: {
      _id: string;
      competition_id: {
        _id: string;
        title: string;
        image_url: string;
        slug: string;
      };
      user_id: {
        _id: string;
        name: string;
        email: string;
      };
      ticket_number: string;
      prize_value: number;
      draw_video_url?: string;
      draw_date: string;
      createdAt: string;
      updatedAt: string;
    }[];
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

export interface LiveStreamResponse {
  success: boolean;
  message: string;
  data: {
    is_live: boolean;
    message: string;
    competition: {
      _id: string;
      title: string;
      slug: string;
      short_description: string;
      long_description: string;
      image_url: string;
      draw_time: string;
      live_draw_watching_url: string | null;
      hls_stream_url: string | null;
      max_tickets: number;
      tickets_sold: number;
    };
    stream: {
      roomId: string;
      viewerCount: number;
      stream_type: string;
      hls_available: boolean;
    };
  };
}

export const competitionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCompetitions: builder.query<CompetitionsResponse, { page: number; limit: number }>({
      query: ({ page = 1, limit = 10 }) => `competitions?page=${page}&limit=${limit}`,
    }),
    getCompetitionById: builder.query<CompetitionDetailsResponse, string>({
      query: (id) => `competitions/${id}`,
    }),
    getMyCompetitions: builder.query<MyCompetitionsResponse, void>({
      query: () => 'competitions/my',
    }),
    getCompetitionTickets: builder.query<CompetitionTicketsResponse, { id: string; page?: number; limit?: number }>({
      query: ({ id, page = 1, limit = 10 }) => `tickets/competition/${id}?page=${page}&limit=${limit}`,
    }),
    getResults: builder.query<ResultsResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => `results?page=${page}&limit=${limit}`,
    }),
    getLiveStream: builder.query<LiveStreamResponse, void>({
      query: () => 'streams/live',
    }),
  }),
});

export const { useGetCompetitionsQuery, useGetCompetitionByIdQuery, useGetMyCompetitionsQuery, useGetCompetitionTicketsQuery, useGetResultsQuery, useGetLiveStreamQuery } = competitionsApi;
