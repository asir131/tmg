import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { LockIcon } from "lucide-react";
import { useState } from "react";

interface PaymentFormProps {
  clientSecret: string;
  paymentIntentId: string;
  onComplete: () => void;
  onError: (message: string) => void;
  amount: number;
  isCreatingIntent: boolean;
  onBack: () => void;
}

export function PaymentForm({
  clientSecret,
  paymentIntentId,
  onComplete,
  onError,
  amount,
  isCreatingIntent,
  onBack,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      onError("Stripe is not loaded");
      return;
    }

    setIsProcessing(true);

    try {
      // Submit the form to get payment details
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message);
        setIsProcessing(false);
        return;
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?payment_intent_id=${paymentIntentId}`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        onError(confirmError.message);
        setIsProcessing(false);
        return;
      }

      // Log payment intent status for debugging
      if (paymentIntent) {
        console.log("Payment confirmed. Status:", paymentIntent.status);
      }

      // Payment succeeded (or requires_action for 3D Secure)
      // Note: status might be "processing" or "requires_action" initially
      if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing" || !confirmError) {
        onComplete();
      } else {
        onError(`Payment status: ${paymentIntent?.status || "unknown"}`);
        setIsProcessing(false);
      }
    } catch (err: any) {
      onError(err?.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement />
      </div>
      <div className="flex items-center justify-center text-sm text-text-secondary mb-6">
        <LockIcon className="w-4 h-4 mr-2" />
        Your payment information is secure and encrypted
      </div>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl bg-gradient-end hover:bg-gray-700 transition-colors"
          disabled={isProcessing}
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 btn-premium"
          disabled={!stripe || isProcessing || isCreatingIntent || !elements}
        >
          {isProcessing || isCreatingIntent
            ? "Processing..."
            : `Pay £${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

