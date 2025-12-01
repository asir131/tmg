import { useState, Fragment, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, LockIcon, TrophyIcon } from "lucide-react";
import { useStripe, Elements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  profileApi,
  useGetPointsSummaryQuery,
  useRedeemPointsMutation,
} from "../store/api/profileApi";
import {
  useGetCartQuery,
  useCreateCheckoutIntentMutation,
  useClearCartMutation,
} from "../store/api/cartApi";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { PaymentForm } from "../components/PaymentForm";
import { AppDispatch } from "../store/store";
import { CartSummary } from "../store/types";

export function Checkout() {
  const stripe = useStripe();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState(1);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasRedeemedPointsRef = useRef(false);
  const [checkoutSummary, setCheckoutSummary] = useState<CartSummary | null>(
    null
  );

  const { data: pointsSummary, refetch: refetchPointsSummary } =
    useGetPointsSummaryQuery();
  const { data: cart, isLoading: isCartLoading } = useGetCartQuery();
  const [createCheckoutIntent, { isLoading: isCreatingIntent }] =
    useCreateCheckoutIntentMutation();
  const [clearCart] = useClearCartMutation();
  const [redeemPoints] = useRedeemPointsMutation();
  const { status: paymentStatus } = usePaymentStatus(paymentIntentId);

  const availablePoints = pointsSummary?.total_points ?? 0;
  const cartSummary = cart?.summary ?? checkoutSummary;
  const cartTotal = cartSummary?.total_price ?? 0;
  // Every 100 points = £1 discount
  const pointsToRedeem = usePoints
    ? Math.min(availablePoints, Math.floor(cartTotal * 100))
    : 0;
  const pointsDiscount = pointsToRedeem / 100;
  const finalAmount = Math.max(0, cartTotal - pointsDiscount);

  useEffect(() => {
    if (!usePoints) {
      setPointsUsed(0);
      hasRedeemedPointsRef.current = false;
    }
  }, [usePoints]);

  // Handle payment success
  useEffect(() => {
    const paymentSucceeded =
      paymentStatus?.tickets_created || paymentStatus?.status === "succeeded";

    if (paymentSucceeded && step === 3) {
      // Clear cart after successful payment
      clearCart();

      // Redeem points after successful payment
      if (usePoints && pointsUsed > 0 && !hasRedeemedPointsRef.current) {
        hasRedeemedPointsRef.current = true;
        (async () => {
          try {
            const res = await redeemPoints({
              amount: pointsUsed,
            }).unwrap();

            // Update the points summary with the response data
            if (res?.data) {
              const { remaining_points, total_redeemed } = res.data;

              dispatch(
                profileApi.util.updateQueryData(
                  "getPointsSummary",
                  undefined,
                  (draft) => {
                    if (!draft) return;
                    // Use the values from backend response
                    if (typeof remaining_points === "number") {
                      draft.total_points = remaining_points;
                    }
                    if (typeof total_redeemed === "number") {
                      draft.total_redeemed = total_redeemed;
                    }
                  }
                )
              );
            }

            refetchPointsSummary();
            dispatch(profileApi.util.invalidateTags(["Profile"]));
          } catch (err: any) {
            console.error("Failed to redeem points:", err);
            console.error("Error details:", {
              status: err?.status,
              data: err?.data,
              message: err?.data?.message,
            });
            toast.error(
              err?.data?.message ||
                err?.message ||
                "Points redemption failed. Please contact support."
            );
          }
        })();
      }
    }
  }, [
    paymentStatus,
    step,
    clearCart,
    usePoints,
    pointsUsed,
    dispatch,
    refetchPointsSummary,
    redeemPoints,
  ]);

  const handleContinueToPayment = async () => {
    if (!cart || cart.cart_items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Create payment intent when moving to payment step
    try {
      setCheckoutSummary(cart.summary);
      const points_to_redeem = pointsToRedeem;
      const intentResult = await createCheckoutIntent({
        points_to_redeem,
      }).unwrap();
      setPointsUsed(points_to_redeem);

      console.log("Payment intent result:", intentResult); // Debug log

      if (!intentResult?.payment_intent_id || !intentResult?.client_secret) {
        throw new Error("Invalid payment intent response");
      }

      setPaymentIntentId(intentResult.payment_intent_id);
      setClientSecret(intentResult.client_secret);
      setStep(2);
    } catch (err: any) {
      console.error("Payment intent creation error:", err); // Debug log
      const message =
        err?.data?.message ||
        err?.message ||
        "Failed to create payment intent. Please try again.";
      toast.error(message);
    }
  };

  const pollForTicketCreation = async (paymentIntentId: string) => {
    const maxAttempts = 30;
    const interval = 2000; // 2 seconds

    setIsProcessing(true);

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/payments/status/${paymentIntentId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        if (!response.ok) {
          console.error(`Payment status check failed: ${response.status}`);
          // Continue polling even if one request fails
          await new Promise((resolve) => setTimeout(resolve, interval));
          continue;
        }

        const data = await response.json();
        console.log(`Poll attempt ${i + 1}:`, data);

        const status = data.data?.status;
        const ticketsCreated = data.data?.tickets_created;

        // If tickets are created, we're done
        if (data.success && ticketsCreated) {
          setIsProcessing(false);
          toast.success("Payment successful! Tickets created.");
          return;
        }

        // If payment succeeded but tickets not created yet, continue polling
        // but show a message that payment was successful
        if (data.success && status === "succeeded" && !ticketsCreated) {
          console.log(
            "Payment succeeded, waiting for tickets to be created..."
          );
          // Continue polling
        }

        // If payment failed, stop polling
        if (status === "failed" || status === "canceled") {
          setIsProcessing(false);
          toast.error(`Payment ${status}`);
          return;
        }

        // If payment is still pending after many attempts, it might be a webhook issue
        if (i >= 20 && status === "pending") {
          console.warn(
            "Payment still pending after 20 attempts - webhook may not be configured"
          );
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (err: any) {
        console.error(`Poll error on attempt ${i + 1}:`, err);
        // Continue polling on error
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    // If we get here, polling timed out
    setIsProcessing(false);
    toast.warning(
      "Payment processing timed out. The payment may have succeeded - please check your entries page or contact support."
    );

    // Show a detailed message to the user
    const userMessage = `
Payment processing is taking longer than expected.

This usually means the Stripe webhook is not configured or not working properly.

Your payment may have succeeded in Stripe, but tickets haven't been created yet.

What to do:
1. Check your entries page - tickets may have been created
2. Contact support with your payment intent ID: ${paymentIntentId}
3. Check Stripe Dashboard to verify payment status

Would you like to check your entries page now?
    `.trim();

    setTimeout(() => {
      if (window.confirm(userMessage)) {
        navigate("/entries");
      }
    }, 2000);
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
            {[1, 2, 3].map((s) => (
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
                {s < 3 && (
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
                {availablePoints >= 100 && (
                  <div className="mb-6">
                    <label className="flex items-center cursor-pointer p-4 bg-gradient-end rounded-xl">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-700 text-accent focus:ring-accent"
                      />
                      <span className="ml-3">
                        Use {availablePoints.toLocaleString()} points (Save £
                        {pointsDiscount.toFixed(2)})
                      </span>
                    </label>
                  </div>
                )}
                <div className="space-y-2 p-4 bg-gradient-end rounded-xl mb-6">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Subtotal</span>
                    <span>£{cartTotal.toFixed(2)}</span>
                  </div>
                  {usePoints && (
                    <div className="flex justify-between text-accent">
                      <span>Points Discount</span>
                      <span>-£{pointsDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-700">
                    <span>Total</span>
                    <span>£{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleContinueToPayment}
                  className="w-full btn-premium"
                >
                  Continue to Payment
                </button>
              </div>
            </motion.div>
          )}
          {/* Step 2: Payment */}
          {step === 2 && (
            <motion.div
              key="step2"
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
                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
                {isCreatingIntent ? (
                  <div className="mb-6 text-center py-8">
                    <p className="text-text-secondary">
                      Preparing payment form...
                    </p>
                  </div>
                ) : !clientSecret ? (
                  <div className="mb-6 text-center py-8">
                    <p className="text-red-500 mb-4">
                      Failed to initialize payment. Please try again.
                    </p>
                    <button
                      onClick={() => {
                        setStep(1);
                        setClientSecret(null);
                        setPaymentIntentId(null);
                      }}
                      className="btn-premium"
                    >
                      Go Back
                    </button>
                  </div>
                ) : clientSecret && stripe ? (
                  <Elements
                    stripe={stripe}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "night",
                        variables: {
                          colorPrimary: "#6366f1",
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      clientSecret={clientSecret}
                      paymentIntentId={paymentIntentId!}
                      onComplete={async () => {
                        setStep(3);
                        setIsProcessing(true);
                        if (paymentIntentId) {
                          await pollForTicketCreation(paymentIntentId);
                        }
                      }}
                      onError={(message) => {
                        toast.error(message);
                        setIsProcessing(false);
                      }}
                      amount={finalAmount}
                      isCreatingIntent={isCreatingIntent}
                      onBack={() => {
                        setStep(1);
                        setClientSecret(null);
                        setPaymentIntentId(null);
                      }}
                    />
                  </Elements>
                ) : (
                  <div className="mb-6 text-center py-8">
                    <p className="text-red-500">
                      Failed to initialize payment. Please try again.
                    </p>
                    <button
                      onClick={() => setStep(1)}
                      className="mt-4 btn-premium"
                    >
                      Go Back
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {/* Step 3: Confirmation */}
          {step === 3 && (
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
                    <LockIcon className="w-12 h-12 text-accent animate-pulse" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-4">
                    Processing your payment...
                  </h2>
                  <p className="text-text-secondary mb-4">
                    Please wait while we create your tickets.
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
                              The Stripe webhook is not configured or not
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
                            Please check the backend webhook configuration. See
                            WEBHOOK_TROUBLESHOOTING.md for details.
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
                      If tickets aren't there, the webhook may not be
                      configured. Contact support with Payment ID:{" "}
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
