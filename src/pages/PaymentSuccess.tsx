import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrophyIcon, CheckCircleIcon, LoaderIcon } from "lucide-react";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentIntentId = searchParams.get("payment_intent_id");
  const { status, loading, error } = usePaymentStatus(paymentIntentId);

  useEffect(() => {
    if (status?.tickets_created) {
      // Redirect to entries page after 3 seconds
      const timer = setTimeout(() => {
        navigate("/entries");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  if (loading || !status) {
    return (
      <div className="py-8">
        <div className="container-premium max-w-2xl text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6"
          >
            <LoaderIcon className="w-12 h-12 text-accent animate-spin" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">Processing your payment...</h1>
          <p className="text-text-secondary">
            Please wait while we create your tickets.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ToastContainer />
        <div className="container-premium max-w-2xl text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircleIcon className="w-12 h-12 text-red-500" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4 text-red-500">
            Payment Error
          </h1>
          <p className="text-text-secondary mb-8">{error}</p>
          <button onClick={() => navigate("/checkout")} className="btn-premium">
            Return to Checkout
          </button>
        </div>
      </div>
    );
  }

  if (status.tickets_created) {
    return (
      <div className="py-8">
        <ToastContainer />
        <div className="container-premium max-w-2xl text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6"
          >
            <TrophyIcon className="w-12 h-12 text-accent" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">Payment Successful! 🎉</h1>
          <p className="text-text-secondary mb-8">
            Your tickets have been created successfully.
          </p>
          <div className="card-premium p-6 bg-gradient-start mb-8 text-left">
            <h3 className="font-semibold mb-4">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Payment Status</span>
                <span className="font-medium capitalize">{status.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Amount</span>
                <span className="font-medium">
                  £{status.amount.toFixed(2)} {status.currency.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Payment Intent ID</span>
                <span className="font-medium text-xs">
                  {status.payment_intent_id.slice(0, 20)}...
                </span>
              </div>
            </div>
          </div>
          <p className="text-text-secondary mb-6">
            Redirecting to your tickets in 3 seconds...
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/entries")}
              className="flex-1 btn-premium"
            >
              View My Tickets
            </button>
            <button
              onClick={() => navigate("/competitions")}
              className="flex-1 py-3 rounded-xl bg-gradient-end hover:bg-gray-700 transition-colors"
            >
              Browse More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container-premium max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">
          Payment Status: {status.status}
        </h1>
        <p className="text-text-secondary">
          Waiting for tickets to be created...
        </p>
      </div>
    </div>
  );
}

