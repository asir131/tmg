import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrophyIcon, CheckCircleIcon, LoaderIcon } from "lucide-react";
import { useLazyGetPaymentStatusQuery } from "../store/api/cartApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { api } from "../store/api/baseApi";

interface PaymentStatusData {
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

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentIntentId = searchParams.get("payment_intent_id");
  const statusParam = searchParams.get("status");
  const processingParam = searchParams.get("processing") === "true";
  const [getPaymentStatus] = useLazyGetPaymentStatusQuery();
  const dispatch = useDispatch();

  // Single source of truth for payment status
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"auth" | "notfound" | "other" | null>(null);

  // SSE connection using fetch with ReadableStream (supports Authorization header)
  const connectSSE = (paymentIntentId: string, token: string): Promise<{ close: () => void }> => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    // VITE_API_BASE_URL already includes /api/v1, so we only need /payments/status-stream
    const url = `${apiBaseUrl}/payments/status-stream/${paymentIntentId}`;
    
    console.log(`[PaymentStatus] Connecting to SSE: ${url}`);
    
    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
    }).then(response => {
      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }
      
      let buffer = '';
      let isClosed = false;
      
      const readStream = async () => {
        try {
          while (!isClosed) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('[PaymentStatus] SSE stream ended');
              break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Keep the last incomplete line in buffer
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.trim() && line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6).trim();
                  if (!jsonStr) continue;
                  
                  const data = JSON.parse(jsonStr);
                  console.log('[PaymentStatus] SSE received:', data);
                  
                  if (data.success && data.data) {
                    const statusData = data.data;
                    console.log(`[PaymentStatus] SSE update received - Status: ${statusData.status}, Tickets: ${statusData.tickets_created}`);
                    setPaymentStatus(statusData);
                    setError(null);
                    setErrorType(null);
                    
                    // Stop SSE on terminal states
                    if (statusData.status === "succeeded" || 
                        statusData.status === "failed" || 
                        statusData.status === "canceled") {
                      console.log(`[PaymentStatus] Terminal state reached via SSE: ${statusData.status}`);
                      isClosed = true;
                      reader.cancel();
                      
                      // Invalidate profile cache when tickets are created
                      if (statusData.tickets_created) {
                        dispatch(api.util.invalidateTags(["Profile"]));
                      }
                      
                      if (statusData.status === "failed" || statusData.status === "canceled") {
                        navigate(`/payment/failure?payment_intent_id=${paymentIntentId}&status=${statusData.status}`);
                      }
                      return;
                    } else {
                      console.log(`[PaymentStatus] Still waiting - Status: ${statusData.status}`);
                    }
                  }
                } catch (parseError) {
                  console.error('[PaymentStatus] Error parsing SSE data:', parseError, 'Line:', line);
                }
              }
            }
          }
        } catch (streamError: any) {
          if (streamError.name !== 'AbortError') {
            console.error('[PaymentStatus] SSE stream error:', streamError);
            throw streamError;
          }
        }
      };
      
      // Start reading stream asynchronously
      readStream().catch(error => {
        console.error('[PaymentStatus] SSE read error:', error);
        throw error;
      });
      
      return {
        close: () => {
          isClosed = true;
          reader.cancel();
        },
      };
    });
  };

  // Fallback polling function
  const startPolling = (paymentIntentId: string) => {
    let pollInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let currentPollCount = 0;
    const POLL_INTERVAL = 2000; // 2 seconds
    const MAX_POLL_TIME = 5 * 60 * 1000; // 5 minutes
    const MAX_POLLS = MAX_POLL_TIME / POLL_INTERVAL; // 150 polls

    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsPolling(false);
          setError("Please log in to check payment status");
          setErrorType("auth");
          if (pollInterval) clearInterval(pollInterval);
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }

        console.log(`[PaymentStatus] Polling attempt ${currentPollCount + 1} for ${paymentIntentId}`);
        const statusData = await getPaymentStatus(paymentIntentId).unwrap();
        console.log(`[PaymentStatus] Received status:`, statusData);
        
        // Log Cashflows check status if available
        if (statusData.cashflows_checked !== undefined) {
          console.log(`[PaymentStatus] Cashflows checked: ${statusData.cashflows_checked}, Last checked: ${statusData.last_checked_at || 'never'}`);
        }
        if (statusData.cashflows_status) {
          console.log(`[PaymentStatus] Cashflows status: ${statusData.cashflows_status}`);
        }
        
        setPaymentStatus(statusData);
        setError(null);
        setErrorType(null);
        currentPollCount++;
        setPollCount(currentPollCount);

        // Stop polling on terminal states
        if (statusData.status === "succeeded" || 
            statusData.status === "failed" || 
            statusData.status === "canceled") {
          console.log(`[PaymentStatus] Terminal state reached: ${statusData.status}, stopping polling`);
          setIsPolling(false);
          if (pollInterval) clearInterval(pollInterval);
          if (timeoutId) clearTimeout(timeoutId);
          
          // Invalidate profile cache when tickets are created
          if (statusData.tickets_created) {
            dispatch(api.util.invalidateTags(["Profile"]));
          }

          if (statusData.status === "failed" || statusData.status === "canceled") {
            navigate(`/payment/failure?payment_intent_id=${paymentIntentId}&status=${statusData.status}`);
          }
          return;
        }

        // Continue polling if still pending/processing
        if (currentPollCount >= MAX_POLLS) {
          console.log(`[PaymentStatus] Max polls reached (${MAX_POLLS}), stopping`);
          setIsPolling(false);
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (err: any) {
        console.error("[PaymentStatus] Error checking payment status:", err);
        
        if (err?.status === 401) {
          setIsPolling(false);
          setError("Authentication expired. Please log in again.");
          setErrorType("auth");
          if (pollInterval) clearInterval(pollInterval);
          if (timeoutId) clearTimeout(timeoutId);
          const currentPath = window.location.pathname + window.location.search;
          navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
        } else if (err?.status === 404) {
          setIsPolling(false);
          setError("Payment not found. Please contact support with the Payment ID.");
          setErrorType("notfound");
          if (pollInterval) clearInterval(pollInterval);
          if (timeoutId) clearTimeout(timeoutId);
        } else {
          // Continue polling on temporary errors (network issues, etc.)
          setError(null);
          setErrorType(null);
        }
      }
    };

    setIsPolling(true);
    checkStatus(); // Initial check
    
    pollInterval = setInterval(checkStatus, POLL_INTERVAL);
    
    timeoutId = setTimeout(() => {
      console.log(`[PaymentStatus] Timeout reached, stopping polling`);
      setIsPolling(false);
      if (pollInterval) clearInterval(pollInterval);
    }, MAX_POLL_TIME);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  };

  // Main effect: Try SSE first, fallback to polling
  useEffect(() => {
    if (!paymentIntentId) return;

    // Redirect to failure page if status param indicates failure
    if (statusParam === "failed" || statusParam === "canceled") {
      navigate(`/payment/failure?payment_intent_id=${paymentIntentId}&status=${statusParam}`);
      return;
    }

    // If backend already reports success, fetch status once to get full details
    // Don't start SSE/polling if already succeeded
    if (statusParam === "succeeded" && !paymentStatus) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        getPaymentStatus(paymentIntentId).unwrap()
          .then(statusData => {
            setPaymentStatus(statusData);
            if (statusData.tickets_created) {
              dispatch(api.util.invalidateTags(["Profile"]));
            }
          })
          .catch(err => {
            console.error('[PaymentStatus] Error fetching status:', err);
          });
      }
      return;
    }

    // Don't connect if payment already succeeded
    if (paymentStatus?.status === "succeeded" || paymentStatus?.status === "failed" || paymentStatus?.status === "canceled") {
      return;
    }

    // Determine if we should monitor status
    // Backend now redirects with processing=true when payment is pending
    const shouldMonitor = 
      processingParam || 
      statusParam === "pending" || 
      statusParam === "processing" ||
      (paymentStatus && (paymentStatus.status === "pending" || paymentStatus.status === "processing"));

    if (!shouldMonitor) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("Please log in to check payment status");
      setErrorType("auth");
      return;
    }

    let sseConnection: { close: () => void } | null = null;
    let pollingCleanup: (() => void) | null = null;
    let sseUpdateTimeout: NodeJS.Timeout | null = null;

    // Try SSE first, but also start polling as backup
    console.log(`[PaymentStatus] Attempting SSE connection for ${paymentIntentId}`);
    
    // Start polling as backup (in case SSE doesn't receive updates)
    pollingCleanup = startPolling(paymentIntentId);
    
    connectSSE(paymentIntentId, token)
      .then(connection => {
        sseConnection = connection;
        console.log('[PaymentStatus] SSE connected successfully');
        
        // Set timeout: if no SSE updates in 30 seconds, ensure polling continues
        sseUpdateTimeout = setTimeout(() => {
          console.warn('[PaymentStatus] No SSE updates received in 30 seconds, relying on polling');
          // Polling is already running, so we're good
        }, 30000);
      })
      .catch(sseError => {
        console.warn('[PaymentStatus] SSE failed, using polling only:', sseError);
        // Polling is already running, so we're good
      });

    return () => {
      console.log(`[PaymentStatus] Cleaning up for ${paymentIntentId}`);
      if (sseConnection) {
        sseConnection.close();
      }
      if (pollingCleanup) {
        pollingCleanup();
      }
      if (sseUpdateTimeout) {
        clearTimeout(sseUpdateTimeout);
      }
    };
  }, [paymentIntentId, processingParam, statusParam, navigate, getPaymentStatus, dispatch]);

  // Handle manual status check
  const handleCheckStatusAgain = async () => {
    if (!paymentIntentId) return;
    
    setError(null);
    setErrorType(null);
    setIsPolling(true);
    setPollCount(0);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsPolling(false);
        toast.error("Please log in to check payment status");
        return;
      }

      const statusData = await getPaymentStatus(paymentIntentId).unwrap();
      setPaymentStatus(statusData);
      
      if (statusData.status === "succeeded") {
        setIsPolling(false);
        if (statusData.tickets_created) {
          dispatch(api.util.invalidateTags(["Profile"]));
        }
      } else if (statusData.status === "failed" || statusData.status === "canceled") {
        navigate(`/payment/failure?payment_intent_id=${paymentIntentId}&status=${statusData.status}`);
      } else {
        // Still pending - restart polling
        setIsPolling(true);
      }
    } catch (err: any) {
      setIsPolling(false);
      if (err?.status === 401) {
        const currentPath = window.location.pathname + window.location.search;
        navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      } else if (err?.status === 404) {
        setError("Payment not found. Please contact support with the Payment ID.");
        setErrorType("notfound");
      } else {
        toast.error("Failed to check payment status. Please try again.");
      }
    }
  };

  // Redirect to entries page after tickets are created
  useEffect(() => {
    if (paymentStatus?.tickets_created && paymentStatus.status === "succeeded") {
      const timer = setTimeout(() => {
        navigate("/entries");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus?.tickets_created, paymentStatus?.status, navigate]);

  // Show error states
  if (error && errorType === "notfound") {
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
            Payment Not Found
          </h1>
          <p className="text-text-secondary mb-4">{error}</p>
          <p className="text-sm text-text-secondary mb-6">
            This may occur if:
            <br />• The payment belongs to a different account
            <br />• The payment ID doesn't match our records
            <br />• The payment hasn't been created yet
          </p>
          {paymentIntentId && (
            <div className="card-premium p-4 bg-gradient-start mb-6 text-left">
              <p className="text-sm">
                <span className="text-text-secondary">Payment ID: </span>
                <span className="font-mono text-xs">{paymentIntentId}</span>
              </p>
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={handleCheckStatusAgain}
              className="flex-1 btn-premium"
            >
              Check Status Again
            </button>
            <button
              onClick={() => navigate("/competitions")}
              className="flex-1 py-3 rounded-xl bg-gradient-end hover:bg-gray-700 transition-colors"
            >
              Return to Competitions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && errorType === "auth") {
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
            Authentication Required
          </h1>
          <p className="text-text-secondary mb-4">{error}</p>
          <p className="text-sm text-text-secondary mb-6">
            After completing payment on Cashflows, you may need to log in again to view your payment status.
          </p>
          <div className="flex gap-4">
            <button onClick={() => navigate("/login")} className="flex-1 btn-premium">
              Log In
            </button>
            <button onClick={() => navigate("/competitions")} className="flex-1 py-3 rounded-xl bg-gradient-end hover:bg-gray-700 transition-colors">
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  if (paymentStatus && (paymentStatus.status === "succeeded" || paymentStatus.tickets_created)) {
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
            {paymentStatus.tickets_created
              ? "Your tickets have been created successfully."
              : "Your payment has been processed. Tickets will be available shortly."}
          </p>
          <div className="card-premium p-6 bg-gradient-start mb-8 text-left">
            <h3 className="font-semibold mb-4">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Payment Status</span>
                <span className="font-medium capitalize">{paymentStatus.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Amount</span>
                <span className="font-medium">
                  £{paymentStatus.amount.toFixed(2)} {paymentStatus.currency.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Payment Intent ID</span>
                <span className="font-medium text-xs">
                  {paymentStatus.payment_intent_id.slice(0, 20)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Tickets Created</span>
                <span className="font-medium">
                  {paymentStatus.tickets_created ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
          {paymentStatus.tickets_created && (
            <p className="text-text-secondary mb-6">
              Redirecting to your tickets in 3 seconds...
            </p>
          )}
          <div className="flex gap-4">
            {paymentStatus.tickets_created && (
              <button
                onClick={() => navigate("/entries")}
                className="flex-1 btn-premium"
              >
                View My Tickets
              </button>
            )}
            <button
              onClick={() => navigate("/competitions")}
              className={`${paymentStatus.tickets_created ? "flex-1" : "w-full"} py-3 rounded-xl bg-gradient-end hover:bg-gray-700 transition-colors`}
            >
              Browse More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show timeout message after 5 minutes of polling
  if (isPolling && pollCount >= 150) {
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
            <LoaderIcon className="w-12 h-12 text-accent" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">
            Payment Processing
          </h1>
          <p className="text-text-secondary mb-4">
            Your payment is taking longer than expected.
          </p>
          <p className="text-sm text-text-secondary mb-6">
            Don't worry - if your payment was successful, your tickets will be available shortly.
            Please check back in a few minutes or contact support if you have any concerns.
          </p>
          {paymentIntentId && (
            <div className="card-premium p-4 bg-gradient-start mb-6 text-left">
              <p className="text-sm">
                <span className="text-text-secondary">Payment ID: </span>
                <span className="font-mono text-xs">{paymentIntentId}</span>
              </p>
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={handleCheckStatusAgain}
              className="flex-1 btn-premium"
            >
              Check Status Again
            </button>
            <button
              onClick={() => navigate("/entries")}
              className="flex-1 py-3 rounded-xl bg-gradient-end hover:bg-gray-700 transition-colors"
            >
              Go to My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show processing state
  const isProcessing = isPolling || 
    processingParam || 
    statusParam === "pending" || 
    statusParam === "processing" ||
    (paymentStatus && (paymentStatus.status === "pending" || paymentStatus.status === "processing"));

  if (isProcessing) {
    const showLongMessage = pollCount > 15; // After 30 seconds
    const showExtendedMessage = pollCount > 30; // After 60 seconds
    
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
            <LoaderIcon className="w-12 h-12 text-accent animate-spin" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">
            Processing Your Payment
          </h1>
          <p className="text-text-secondary mb-4">
            {showExtendedMessage
              ? "Your payment is taking longer than usual to process."
              : showLongMessage
              ? "Your payment is being processed. This may take a few moments..."
              : "Please wait while we confirm your payment..."}
          </p>
          {showExtendedMessage && (
            <div className="card-premium p-4 bg-gradient-start mb-6 text-left">
              <p className="text-sm text-text-secondary mb-2">
                <strong>What's happening?</strong>
              </p>
              <p className="text-sm text-text-secondary mb-2">
                Your payment has been received, but the confirmation is taking longer than expected. This can happen if:
              </p>
              <ul className="text-sm text-text-secondary list-disc list-inside mb-2 space-y-1">
                <li>The payment provider is processing your transaction</li>
                <li>There's a temporary delay in webhook processing</li>
                <li>The backend is verifying your payment</li>
              </ul>
              <p className="text-sm text-text-secondary mt-2">
                <strong>Don't worry:</strong> If your payment was successful, your tickets will be available shortly. You can check back in a few minutes or contact support if you have concerns.
              </p>
            </div>
          )}
          {showLongMessage && !showExtendedMessage && (
            <p className="text-sm text-text-secondary mb-4">
              If this takes longer than expected, don't worry - your payment will be processed.
              You can check back in a few minutes or contact support if needed.
            </p>
          )}
          {paymentIntentId && (
            <div className="card-premium p-4 bg-gradient-start mb-6 text-left">
              <p className="text-sm">
                <span className="text-text-secondary">Payment ID: </span>
                <span className="font-mono text-xs">{paymentIntentId}</span>
              </p>
              {paymentStatus && (
                <p className="text-sm mt-2">
                  <span className="text-text-secondary">Amount: </span>
                  <span className="font-medium">£{paymentStatus.amount.toFixed(2)} {paymentStatus.currency.toUpperCase()}</span>
                </p>
              )}
            </div>
          )}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleCheckStatusAgain}
              className="flex-1 btn-premium"
            >
              Check Status Again
            </button>
            <button
              onClick={() => navigate("/entries")}
              className="flex-1 py-3 rounded-xl bg-gradient-end hover:bg-gray-700 transition-colors"
            >
              Check My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback - initial loading or no status
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
          <LoaderIcon className="w-12 h-12 text-accent animate-spin" />
        </motion.div>
        <h1 className="text-4xl font-bold mb-4">Payment Received</h1>
        <p className="text-text-secondary">
          {statusParam ? `Status: ${statusParam}` : "Checking payment status..."}
        </p>
        {paymentIntentId && (
          <p className="text-sm text-text-secondary mt-4">
            Payment ID: {paymentIntentId.slice(0, 20)}...
          </p>
        )}
      </div>
    </div>
  );
}
