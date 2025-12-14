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

    let isMounted = true;

    const fetchStatus = async () => {
      if (!isMounted) return;

      setLoading(true);
      try {
        const result = await getPaymentStatus(paymentIntentId).unwrap();
        if (isMounted) {
          setStatus(result);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.data?.message || err?.message || 'Failed to get payment status');
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
