import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircleIcon } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentIntentId = searchParams.get("payment_intent_id");
  const status = searchParams.get("status");

  const isCanceled = status === "canceled";
  const errorMessage = isCanceled
    ? "Your payment was canceled."
    : "Your payment could not be processed.";

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
          <XCircleIcon className="w-12 h-12 text-red-500" />
        </motion.div>
        <h1 className="text-4xl font-bold mb-4 text-red-500">
          Payment Failed
        </h1>
        <p className="text-text-secondary mb-8">{errorMessage}</p>
        {paymentIntentId && (
          <div className="card-premium p-6 bg-gradient-start mb-8 text-left">
            <h3 className="font-semibold mb-4">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Payment Status</span>
                <span className="font-medium capitalize">{status || "unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Payment Intent ID</span>
                <span className="font-medium text-xs">
                  {paymentIntentId.slice(0, 20)}...
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/competitions")}
            className="flex-1 btn-premium"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/checkout")}
            className="flex-1 py-3 rounded-xl bg-gradient-end hover:bg-gray-700 transition-colors"
          >
            Return to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

