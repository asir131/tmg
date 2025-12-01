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

    const pollStatus = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        const result = await getPaymentStatus(paymentIntentId).unwrap();
        if (isMounted) {
          setStatus(result);
          if (result.tickets_created) {
            setLoading(false);
          } else {
            setLoading(false); // Still set loading to false so UI can show status
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.data?.message || err?.message || 'Failed to get payment status');
          setLoading(false);
        }
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2000); // Poll every 2 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [paymentIntentId, getPaymentStatus]);

  return { status, loading, error };
}

