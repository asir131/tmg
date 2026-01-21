import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, LoaderIcon } from "lucide-react";
import { toast } from "react-toastify";
import { useCreateSinglePurchaseIntentMutation } from "../store/api/cartApi";
import { addBlockedCompetition } from "../utils/blockedCompetitions";

interface SinglePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  quantity: number;
  ticketPrice: number;
  competitionTitle: string;
  answer: string;
  onBlocked: () => void;
}

export function SinglePurchaseModal({
  isOpen,
  onClose,
  competitionId,
  quantity,
  ticketPrice,
  competitionTitle,
  answer,
  onBlocked,
}: SinglePurchaseModalProps) {
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  const [createSinglePurchaseIntent] = useCreateSinglePurchaseIntentMutation();

  const total = ticketPrice * quantity;

  // Helper function to check if error is a wrong answer error
  const isWrongAnswerError = (error: any): boolean => {
    return (
      error?.data?.code === 'WRONG_ANSWER' ||
      error?.data?.code === 'INCORRECT_ANSWER' ||
      error?.data?.message?.toLowerCase().includes('incorrect answer') ||
      error?.data?.message?.toLowerCase().includes('wrong answer') ||
      (error?.status === 403 && error?.data?.message?.toLowerCase().includes('answer'))
    );
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsCreatingIntent(false);
      setPromoCode('');
      setPromoError('');
    }
  }, [isOpen]);

  const createPaymentIntent = async () => {
    setIsCreatingIntent(true);
    setPromoError('');
    try {
      const intentResult = await createSinglePurchaseIntent({
        competition_id: competitionId,
        quantity: quantity,
        answer: answer,
        promo_code: promoCode.trim() || undefined, // Only send if not empty
      }).unwrap();

      // Redirect to Cashflows checkout page
      if (intentResult.checkout_url) {
        window.location.href = intentResult.checkout_url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      // Check if error is due to wrong answer
      if (isWrongAnswerError(err)) {
        addBlockedCompetition(competitionId);
        onBlocked();
        const errorMessage = "Incorrect answer. You are now permanently blocked from purchasing tickets for this competition.";
        toast.error(errorMessage);
        onClose();
      } else if (err?.data?.code === 'PROMO_CODE_ERROR' || err?.data?.message?.toLowerCase().includes('promo')) {
        // Handle promo code errors - don't close modal, let user fix
        const errorMessage = err?.data?.message || 'Invalid promo code';
        setPromoError(errorMessage);
        toast.error(errorMessage);
      } else {
        const message =
          err?.data?.message ||
          err?.message ||
          "Failed to create payment intent. Please try again.";
        toast.error(message);
        onClose();
      }
    } finally {
      setIsCreatingIntent(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="card-premium p-8 max-w-2xl w-full max-h-[90vh] flex flex-col"
        >
          {/* Fixed Header */}
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold">Complete Purchase</h2>
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-white transition-colors"
                disabled={isCreatingIntent}
              >
                <XIcon className="w-6 h-6" />
              </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-0 scrollable-modal">
            <div className="mb-6 p-4 bg-gradient-end rounded-xl">
              <h3 className="font-semibold mb-2">{competitionTitle}</h3>
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>Quantity:</span>
                <span>{quantity} tickets</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>Price per ticket:</span>
                <span>£{ticketPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                <span>Total:</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            {!isCreatingIntent && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Promo Code (Optional)
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoError('');
                  }}
                  placeholder="Enter promo code"
                  className="w-full px-4 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors uppercase"
                  disabled={isCreatingIntent}
                />
                {promoError && (
                  <p className="text-red-400 text-sm mt-2">{promoError}</p>
                )}
                <p className="text-text-secondary text-xs mt-2">
                  If you have a promo code, enter it above before proceeding to payment
                </p>
              </div>
            )}

            {isCreatingIntent ? (
              <div className="mb-6 text-center py-8">
                <LoaderIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
                <p className="text-text-secondary">Redirecting to payment...</p>
                {promoCode && (
                  <p className="text-sm text-accent mt-2">Applying promo code: {promoCode}</p>
                )}
              </div>
            ) : (
              <button
                onClick={createPaymentIntent}
                disabled={isCreatingIntent}
                className="w-full btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Payment
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
