import { useState, Fragment, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, TrophyIcon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  profileApi,
  useGetPointsSummaryQuery,
} from "../store/api/profileApi";
import {
  useGetCartQuery,
  useCreateCheckoutIntentMutation,
  useClearCartMutation,
} from "../store/api/cartApi";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { AppDispatch } from "../store/store";
import { CartSummary } from "../store/types";

export function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState(1);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(
    searchParams.get("payment_intent_id")
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSummary, setCheckoutSummary] = useState<CartSummary | null>(
    null
  );
  const [checkoutResponse, setCheckoutResponse] = useState<{
    discount_amount: number;
    points_redeemed: number;
    amount: number;
    promo_discount: number;
    promo_code_applied: string | null;
  } | null>(null);

  const { data: pointsSummary, refetch: refetchPointsSummary } =
    useGetPointsSummaryQuery();
  const { data: cart, isLoading: isCartLoading } = useGetCartQuery();
  const [createCheckoutIntent, { isLoading: isCreatingIntent }] =
    useCreateCheckoutIntentMutation();
  const [clearCart] = useClearCartMutation();
  const { status: paymentStatus } = usePaymentStatus(paymentIntentId);

  const availablePoints = pointsSummary?.total_points ?? 0;
  const cartSummary = cart?.summary ?? checkoutSummary;
  const cartTotal = cartSummary?.total_price ?? 0;

  // Max points user can redeem: limited by balance and cart value (100 points = £1)
  const maxRedeemablePoints = Math.min(
    availablePoints,
    Math.floor(cartTotal * 100)
  );
  // Effective amount to use: only when checkbox on, clamped to max, multiples of 100
  const effectivePointsToUse = usePoints
    ? Math.min(
        Math.max(0, Math.floor(pointsToUse / 100) * 100),
        maxRedeemablePoints
      )
    : 0;

  // Use discount from checkout response if available, otherwise from points selection
  const pointsDiscount =
    checkoutResponse?.discount_amount ?? effectivePointsToUse / 100;
  const finalAmount =
    checkoutResponse?.amount ?? Math.max(0, cartTotal - pointsDiscount);

  useEffect(() => {
    if (!usePoints) {
      setPointsToUse(0);
      setPointsToRedeem(0);
      setCheckoutResponse(null);
    }
  }, [usePoints]);

  // When user turns on "use points", default to max
  const handleUsePointsChange = (checked: boolean) => {
    setUsePoints(checked);
    if (checked) {
      setPointsToUse(maxRedeemablePoints);
    } else {
      setPointsToUse(0);
    }
  };

  // Clamp pointsToUse when max redeemable shrinks (e.g. cart or balance change)
  useEffect(() => {
    if (maxRedeemablePoints >= 100 && pointsToUse > maxRedeemablePoints) {
      setPointsToUse(maxRedeemablePoints);
    }
  }, [maxRedeemablePoints, pointsToUse]);

  // Handle payment success
  useEffect(() => {
    const paymentSucceeded =
      paymentStatus?.tickets_created || paymentStatus?.status === "succeeded";

    if (paymentSucceeded && step === 2) {
      // Clear cart after successful payment
      clearCart();
      
      // Points were already redeemed during checkout intent creation
      // Just refresh the points summary to reflect the updated balance
      if (checkoutResponse?.points_redeemed && checkoutResponse.points_redeemed > 0) {
        refetchPointsSummary();
        dispatch(profileApi.util.invalidateTags(["Profile"]));
      }
    }
  }, [
    paymentStatus,
    step,
    clearCart,
    checkoutResponse,
    dispatch,
    refetchPointsSummary,
  ]);

  // Check if returning from payment
  useEffect(() => {
    const paymentIntentIdParam = searchParams.get("payment_intent_id");
    const status = searchParams.get("status");
    
    if (paymentIntentIdParam) {
      setPaymentIntentId(paymentIntentIdParam);
      // If returning from payment, go to confirmation step
      if (status === "succeeded" || status === "pending" || status === "processing") {
        setStep(3);
        setIsProcessing(status === "processing" || status === "pending");
      } else if (status === "failed" || status === "canceled") {
        // Redirect to failure page
        navigate(`/payment/failure?payment_intent_id=${paymentIntentIdParam}&status=${status}`);
      }
    }
  }, [searchParams, navigate]);

  const handleContinueToPayment = async () => {
    if (!cart || cart.cart_items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (isCreatingIntent) {
      return; // Prevent multiple clicks
    }

    // Create payment intent and redirect to Cashflows
    try {
      setCheckoutSummary(cart.summary);
      setPromoError('');
      const points_to_redeem = effectivePointsToUse;

      const intentResult = await createCheckoutIntent({
        points_to_redeem: points_to_redeem > 0 ? points_to_redeem : undefined,
        promo_code: promoCode.trim() || undefined, // Only send if not empty
      }).unwrap();
      
      // Store checkout response for later use (includes discount info)
      setCheckoutResponse({
        discount_amount: intentResult.discount_amount,
        points_redeemed: intentResult.points_redeemed,
        amount: intentResult.amount,
        promo_discount: intentResult.promo_discount || 0,
        promo_code_applied: intentResult.promo_code_applied,
      });
      setPointsToRedeem(intentResult.points_redeemed);

      if (!intentResult?.payment_intent_id || !intentResult?.checkout_url) {
        throw new Error("Invalid payment intent response");
      }

      // Redirect to Cashflows checkout page
      window.location.href = intentResult.checkout_url;
    } catch (err: any) {
      // Log full error for debugging
      console.error("[Checkout] Error creating payment intent:", {
        status: err?.status,
        data: err?.data,
        error: err?.error,
        message: err?.message,
        originalError: err,
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      });
      
      // Handle promo code specific errors
      if (err?.data?.code === 'PROMO_CODE_ERROR' || err?.data?.message?.toLowerCase().includes('promo')) {
        const errorMessage = err?.data?.message || 'Invalid promo code';
        setPromoError(errorMessage);
        toast.error(errorMessage);
        return; // Don't close modal, let user fix promo code
      }
      
      // Handle validation errors (matches backend guide)
      if (err?.data?.errors && Array.isArray(err.data.errors)) {
        // Show each validation error
        err.data.errors.forEach((error: any) => {
          const errorMessage = error.competition_title 
            ? `${error.competition_title}: ${error.error}`
            : error.error;
          toast.error(errorMessage);
        });
      } else if (err?.status === 500 || err?.data?.status === 500) {
        // Handle 500 Internal Server Error
        const errorMessage = err?.data?.message || 
          "Server error occurred. Please try again or contact support if the problem persists.";
        toast.error(errorMessage);
        
        // Log detailed error information for backend team
        console.error("[Checkout] 500 Server Error - Details for backend team:", {
          endpoint: "/api/v1/payments/create-intent/checkout",
          status: err?.status || err?.data?.status,
          message: err?.data?.message,
          error: err?.error,
          responseData: err?.data,
          cartItems: cart?.cart_items?.map(item => ({
            competition_id: item.competition_id,
            quantity: item.quantity,
          })),
          pointsToRedeem: effectivePointsToUse,
        });
      } else if (err?.status === 400 || err?.data?.status === 400) {
        // Handle 400 Bad Request (validation errors, cart empty, etc.)
        const message =
          err?.data?.message ||
          err?.message ||
          "Invalid request. Please check your cart and try again.";
        toast.error(message);
      } else if (err?.status === 401 || err?.data?.status === 401) {
        // Handle 401 Unauthorized
        toast.error("Your session has expired. Please login again.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else if (err?.status === 'FETCH_ERROR' || err?.error === 'TypeError: Failed to fetch') {
        // Handle connection refused / network errors
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'not configured';
        const errorMessage = 
          "Cannot connect to the server. Please ensure the backend server is running.";
        toast.error(errorMessage);
        console.error("[Checkout] Connection Error:", {
          error: err?.error,
          apiBaseUrl: apiUrl,
          message: "Backend server may not be running. Check if server is running on the configured port.",
        });
      } else {
        // Handle other errors (network errors, etc.)
        const message =
          err?.data?.message ||
          err?.message ||
          "Failed to create payment intent. Please check your connection and try again.";
        toast.error(message);
      }
    }
  };

  if (isCartLoading) {
    return (
      <div className="py-8">
        <div className="container-premium max-w-4xl text-center">
          Loading cart...
        </div>
      </div>
    );
  }

  const hasSnapshot = !!checkoutSummary;
  if ((!cart || cart.cart_items.length === 0) && !hasSnapshot) {
    return (
      <div className="py-8">
        <div className="container-premium max-w-4xl text-center">
          <h1 className="text-4xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-text-secondary mb-6">
            Add some competitions to your cart to checkout.
          </p>
          <button
            onClick={() => navigate("/competitions")}
            className="btn-premium"
          >
            Browse Competitions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <ToastContainer />
      <div className="container-premium max-w-4xl">
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <h1 className="text-4xl font-bold mb-8">Checkout</h1>
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2].map((s) => (
              <Fragment key={s}>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step >= s ? "bg-accent" : "bg-gradient-end"
                  } transition-colors`}
                >
                  {step > s ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <span>{s}</span>
                  )}
                </div>
                {s < 2 && (
                  <div
                    className={`w-24 h-1 ${
                      step > s ? "bg-accent" : "bg-gradient-end"
                    } transition-colors`}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </motion.div>
        <AnimatePresence mode="wait">
          {/* Step 1: Order Review */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -20,
              }}
              className="space-y-6"
            >
              <div className="card-premium p-6">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {cart?.cart_items.map((item) => (
                    <div
                      key={item._id}
                      className="flex justify-between items-center p-4 bg-gradient-end rounded-xl"
                    >
                      <div>
                        <div className="font-semibold mb-1">
                          {item.competition_title}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {item.quantity}{" "}
                          {item.quantity === 1 ? "ticket" : "tickets"}
                        </div>
                      </div>
                      <div className="text-lg font-bold">
                        £{(item.ticket_price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Promo Code Input */}
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
                  {promoCode && !promoError && (
                    <p className="text-accent text-sm mt-2">
                      ✓ Promo code will be applied at checkout
                    </p>
                  )}
                </div>
                {/* Points Redemption Section */}
                <div className="mb-6 p-4 bg-gradient-end rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrophyIcon className="w-5 h-5 text-accent" />
                      <span className="font-semibold">Loyalty Points</span>
                    </div>
                    <span className="text-accent font-bold">
                      {availablePoints.toLocaleString()} points
                    </span>
                  </div>
                  {availablePoints >= 100 ? (
                    <div className="mt-3 space-y-3">
                      <label
                        className={`flex items-center ${maxRedeemablePoints >= 100 ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                      >
                        <input
                          type="checkbox"
                          checked={usePoints}
                          disabled={maxRedeemablePoints < 100}
                          onChange={(e) =>
                            handleUsePointsChange(e.target.checked)
                          }
                          className="w-5 h-5 rounded border-gray-700 text-accent focus:ring-accent disabled:cursor-not-allowed"
                        />
                        <span className="ml-3">
                          {effectivePointsToUse > 0
                            ? `Using ${effectivePointsToUse.toLocaleString()} points to save £${(effectivePointsToUse / 100).toFixed(2)}`
                            : `Use your points (up to ${maxRedeemablePoints.toLocaleString()} points for £${(maxRedeemablePoints / 100).toFixed(2)} off)`}
                        </span>
                      </label>
                      {usePoints && maxRedeemablePoints >= 100 && (
                        <>
                          <p className="text-xs text-text-secondary">
                            100 points = £1 discount
                          </p>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={maxRedeemablePoints}
                              step={100}
                              value={pointsToUse}
                              onChange={(e) =>
                                setPointsToUse(Number(e.target.value))
                              }
                              className="flex-1 h-2 rounded-lg appearance-none bg-gray-700 accent-accent"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setPointsToUse(maxRedeemablePoints)
                              }
                              className="text-sm font-medium text-accent hover:underline whitespace-nowrap"
                            >
                              Use max
                            </button>
                          </div>
                          <div className="flex justify-between text-xs text-text-secondary">
                            <span>0</span>
                            <span>
                              {maxRedeemablePoints.toLocaleString()} points
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary mt-2">
                      {availablePoints > 0
                        ? `You need ${100 - availablePoints} more points to redeem (minimum 100 points required)`
                        : 'Earn points with every purchase! 100 points = £1 discount'}
                    </p>
                  )}
                </div>
                <div className="space-y-2 p-4 bg-gradient-end rounded-xl mb-6">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Subtotal</span>
                    <span>£{cartTotal.toFixed(2)}</span>
                  </div>
                  {effectivePointsToUse > 0 && (
                    <div className="flex justify-between text-accent">
                      <span>Points Discount</span>
                      <span>-£{pointsDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {checkoutResponse?.promo_discount && checkoutResponse.promo_discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Promo Code Discount ({checkoutResponse.promo_code_applied})</span>
                      <span>-£{checkoutResponse.promo_discount.toFixed(2)}</span>
                    </div>
                  )}
                  {promoCode && (!checkoutResponse?.promo_discount || checkoutResponse.promo_discount === 0) && (
                    <div className="text-sm text-text-secondary italic">
                      Promo code discount will be calculated at payment
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-700">
                    <span>Total</span>
                    <span>£{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleContinueToPayment}
                  disabled={isCreatingIntent}
                  className="w-full btn-premium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingIntent ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Payment...
                    </>
                  ) : (
                    "Continue to Payment"
                  )}
                </button>
              </div>
            </motion.div>
          )}
          {/* Step 2: Confirmation */}
          {step === 2 && (
            <motion.div
              key="step3"
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="card-premium p-8 text-center"
            >
              {isProcessing ||
              (!paymentStatus && paymentIntentId) ||
              (paymentStatus &&
                paymentStatus.status !== "succeeded" &&
                !paymentStatus.tickets_created) ? (
                <>
                  <motion.div
                    initial={{
                      scale: 0,
                    }}
                    animate={{
                      scale: 1,
                    }}
                    transition={{
                      delay: 0.2,
                      type: "spring",
                    }}
                    className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircleIcon className="w-12 h-12 text-accent animate-pulse" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-4">
                    Processing your payment...
                  </h2>
                  <p className="text-text-secondary mb-4">
                    Please wait while we confirm your payment and create your tickets.
                  </p>
                  {paymentStatus && (
                    <div className="text-sm text-text-secondary space-y-2 mb-4 p-4 bg-gradient-end rounded-lg">
                      <p>
                        Status:{" "}
                        <span className="font-semibold capitalize">
                          {paymentStatus.status}
                        </span>
                      </p>
                      <p>
                        Tickets Created:{" "}
                        <span className="font-semibold">
                          {paymentStatus.tickets_created ? "Yes" : "No"}
                        </span>
                      </p>
                      {paymentStatus.status === "pending" && (
                        <div className="text-yellow-400 text-xs mt-3 space-y-1">
                          <p className="font-semibold">
                            ⚠ Payment Processing Issue Detected
                          </p>
                          <p>
                            The payment was confirmed but is stuck at "pending"
                            status. This usually means:
                          </p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>
                              The payment webhook is not configured or not
                              working
                            </li>
                            <li>
                              The backend webhook handler is not processing the
                              payment
                            </li>
                            <li>
                              The payment may require additional authentication
                            </li>
                          </ul>
                          <p className="mt-2">
                            Please check the backend webhook configuration.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {!paymentStatus && paymentIntentId && (
                    <p className="text-sm text-text-secondary mt-2">
                      Checking payment status...
                    </p>
                  )}
                  <div className="mt-4 space-y-3">
                    <button
                      onClick={() => navigate("/entries")}
                      className="w-full btn-premium"
                    >
                      Check My Entries (Payment may have succeeded)
                    </button>
                    <p className="text-xs text-text-secondary text-center">
                      If tickets aren't there, please contact support with Payment ID:{" "}
                      <span className="font-mono text-xs">
                        {paymentIntentId?.slice(0, 20)}...
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{
                      scale: 0,
                    }}
                    animate={{
                      scale: 1,
                    }}
                    transition={{
                      delay: 0.2,
                      type: "spring",
                    }}
                    className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <TrophyIcon className="w-12 h-12 text-accent" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-4">
                    Purchase Complete!
                  </h2>
                  <p className="text-text-secondary mb-8">
                    Thank you for your purchase. Your tickets have been
                    confirmed and you'll receive a confirmation email shortly.
                  </p>
                  {paymentStatus && (
                    <div className="card-premium p-6 bg-gradient-start mb-8 text-left">
                      <h3 className="font-semibold mb-4">Order Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">
                            Payment Intent ID
                          </span>
                          <span className="font-medium">
                            {paymentStatus.payment_intent_id.slice(0, 20)}...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">
                            Total Tickets
                          </span>
                          <span className="font-medium">
                            {cartSummary?.total_items ?? 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">
                            Amount Paid
                          </span>
                          <span className="font-medium">
                            £{paymentStatus.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button
                      onClick={() => navigate("/entries")}
                      className="flex-1 btn-premium"
                    >
                      View My Entries
                    </button>
                    <button
                      onClick={() => navigate("/competitions")}
                      className="flex-1 py-3 rounded-xl bg-gradient-end hover:bg-gray-700 transition-colors"
                    >
                      Browse More
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
