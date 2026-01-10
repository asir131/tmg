import { useState, useEffect } from 'react';
import { useLazyGetPaymentStatusQuery } from '../store/api/cartApi';

export interface PaymentStatus {
  payment_intent_id: string;
  status: string;
  amount: number;
  currency: string;
  tickets_created: boolean;
  created_at: string;
  updated_at: string;
  last_checked_at?: string;
  cashflows_checked?: boolean;
  cashflows_status?: string;
}

export function usePaymentStatus(paymentIntentId: string | null) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [getPaymentStatus] = useLazyGetPaymentStatusQuery();

  useEffect(() => {
    if (!paymentIntentId) {
      setStatus(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Check if user is authenticated before making the request
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Please log in to view payment status');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchStatus = async () => {
      if (!isMounted) return;

      setLoading(true);
      setError(null);
      try {
        const result = await getPaymentStatus(paymentIntentId).unwrap();
        if (isMounted) {
          setStatus(result);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          // Handle specific error cases based on backend requirements
          if (err?.status === 401 || err?.status === 'FETCH_ERROR') {
            setError('Authentication required. Please log in to view payment status.');
          } else if (err?.status === 404) {
            setError('Payment not found. This may occur if the payment belongs to a different account or the payment ID is incorrect.');
          } else {
            setError(err?.data?.message || err?.message || 'Failed to get payment status');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Single fetch instead of continuous polling to avoid repeated API calls
    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [paymentIntentId, getPaymentStatus]);

  return { status, loading, error };
}
