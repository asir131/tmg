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

  // Create payment intent when modal opens
  useEffect(() => {
    if (isOpen && !isCreatingIntent) {
      createPaymentIntent();
    }
    
    // Reset when modal closes
    if (!isOpen) {
      setIsCreatingIntent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const createPaymentIntent = async () => {
    setIsCreatingIntent(true);
    try {
      const intentResult = await createSinglePurchaseIntent({
        competition_id: competitionId,
        quantity: quantity,
        answer: answer,
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

            {isCreatingIntent ? (
              <div className="mb-6 text-center py-8">
                <LoaderIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
                <p className="text-text-secondary">Redirecting to payment...</p>
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
