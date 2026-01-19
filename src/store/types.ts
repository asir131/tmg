export interface Category {
  _id: string;
  name: string;
  slug: string;
  image_url?: string; // Added image_url as it's present in the detailed response
}

export interface Competition {
  _id: string;
  title: string;
  short_description: string;
  long_description: string;
  image_url: string | null;
  gallery_images?: string[];
  category_id: Category | null;
  draw_time: string;
  cash_alternative: number;
  ticket_price: number;
  max_tickets: number;
  max_per_person: number;
  tickets_sold: number;
  draw_countdown: string;
  status: string;
  live_draw_watching_url: string | null;
  hls_stream_url: string | null;
  stream_room_id: string | null;
  stream_started_at: string | null;
  createdAt: string;
  updatedAt: string;
  slug: string;
  __v: number;
  // New fields from single competition response
  status_message?: string;
  start_date?: string;
  end_date?: string;
  progress_percentage?: number;
  live_draw_value?: string;
  total_tickets?: number;
  total_paid?: number;
}

export interface CompetitionDetailsResponse {
  success: boolean;
  message: string;
  data: {
    competition: Competition;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CompetitionsResponse {
  success: boolean;
  message: string;
  data: {
    competitions: Competition[];
    pagination: Pagination;
  };
}

export interface User {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  phone_number?: string | null;  // Added for phone number support
  role?: string;
  verified?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface CartItem {
  _id: string;
  competition_id: string;
  competition_title: string;
  competition_slug: string;
  competition_short_description: string;
  competition_image_url: string;
  ticket_price: number;
  quantity: number;
  total_price: number;
  discount_amount?: number;
  points_redeemed?: number;
  max_per_person: number;
  existing_tickets: number;
  available_to_add: number;
  remaining_tickets: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartSummary {
  total_items: number;
  total_price: number;
  item_count: number;
  discount_amount?: number;
  points_redeemed?: number;
  payable_total?: number;
}

export interface Cart {
  cart_items: CartItem[];
  summary: CartSummary;
}

export interface CartResponse {
  success: boolean;
  message: string;
  data: Cart;
}
