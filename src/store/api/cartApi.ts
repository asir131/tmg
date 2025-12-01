import { api } from './baseApi';
import { Cart, CartItem } from '../types';

export const cartApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<Cart, void>({
      query: () => '/user/cart',
      transformResponse: (response: { data: Cart }) => response.data,
      providesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation<CartItem, { itemId: string; quantity: number }>({
      query: ({ itemId, quantity }) => ({
        // Backend uses /user/cart/:itemId for updates
        url: `/user/cart/${itemId}`,
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: builder.mutation<void, string>({
      query: (itemId) => ({
        // Backend uses /user/cart/:itemId for deletes
        url: `/user/cart/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    addToCart: builder.mutation<{ cart_item: CartItem }, { competition_id: string; quantity: number; points_to_redeem?: number; use_points?: boolean }>({
      query: (body) => ({
        // API expects add-to-cart at /user/cart (no /item suffix)
        url: '/user/cart',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cart'],
    }),
    createCheckoutIntent: builder.mutation<
      {
        payment_intent_id: string;
        client_secret: string;
        amount: number;
        currency: string;
        cart_total: number;
        discount_amount: number;
        points_redeemed: number;
      },
      { points_to_redeem: number }
    >({
      query: (body) => ({
        url: '/payments/create-intent/checkout',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { 
        success: boolean;
        message: string;
        data: {
          payment_intent_id: string;
          client_secret: string;
          amount: number;
          currency: string;
          cart_total: number;
          discount_amount: number;
          points_redeemed: number;
        }
      }) => response.data,
    }),
    createSinglePurchaseIntent: builder.mutation<
      {
        payment_intent_id: string;
        client_secret: string;
        amount: number;
        currency: string;
      },
      { competition_id: string; quantity: number }
    >({
      query: (body) => ({
        url: '/payments/create-intent/single',
        method: 'POST',
        body,
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: {
          payment_intent_id: string;
          client_secret: string;
          amount: number;
          currency: string;
        }
      }) => response.data,
    }),
    getPaymentStatus: builder.query<
      {
        payment_intent_id: string;
        status: string;
        amount: number;
        currency: string;
        tickets_created: boolean;
        created_at: string;
        updated_at: string;
      },
      string
    >({
      query: (paymentIntentId) => ({
        url: `/payments/status/${paymentIntentId}`,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    clearCart: builder.mutation<void, void>({
      query: () => ({
        url: '/user/cart/clear',
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useAddToCartMutation,
  useCreateCheckoutIntentMutation,
  useCreateSinglePurchaseIntentMutation,
  useGetPaymentStatusQuery,
  useLazyGetPaymentStatusQuery,
  useClearCartMutation,
} = cartApi;
