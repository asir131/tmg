import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, MailIcon, LoaderIcon } from 'lucide-react';
import { toast } from 'react-toastify';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerifySuccess: () => void;
  onResendOTP: () => Promise<void>;
  onVerifyOTP: (otp: string) => Promise<void>;
  isVerifying?: boolean;
  isResending?: boolean;
}

export function OTPVerificationModal({
  isOpen,
  onClose,
  email,
  onVerifySuccess,
  onResendOTP,
  onVerifyOTP,
  isVerifying = false,
  isResending = false,
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  // Reset OTP when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOtp(['', '', '', '', '', '']);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only accept 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('').slice(0, 6);
      setOtp(newOtp);
      
      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP code');
      return;
    }

    try {
      await onVerifyOTP(otpString);
      onVerifySuccess();
    } catch (error) {
      // Error handling is done in parent component
      // Reset OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await onResendOTP();
      toast.success('OTP has been resent to your email');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('[OTPModal] Modal opened for email:', email);
    }
  }, [isOpen, email]);

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
          className="card-premium p-8 max-w-md w-full"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Verify Your Email</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-white transition-colors"
              disabled={isVerifying}
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Email Icon and Message */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-end border border-gray-700 mb-4">
              <MailIcon className="w-8 h-8 text-accent" />
            </div>
            <p className="text-text-secondary mb-2">
              We've sent a verification code to
            </p>
            <p className="font-semibold text-white mb-4">{email}</p>
            <div className="bg-gradient-end border border-gray-700 rounded-lg p-3 text-sm text-text-secondary">
              <p className="mb-1">📧 Please check your email inbox</p>
              <p className="text-xs">💡 Don't forget to check your spam/junk folder</p>
            </div>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-center">
              Enter 6-digit verification code
            </label>
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isVerifying}
                  className="w-12 h-14 text-center text-xl font-semibold bg-gradient-end border border-gray-700 rounded-xl focus:border-accent focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <motion.button
            onClick={handleVerify}
            disabled={isVerifying || otp.join('').length !== 6}
            className="w-full btn-premium mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isVerifying ? 1 : 1.02 }}
            whileTap={{ scale: isVerifying ? 1 : 0.98 }}
          >
            {isVerifying ? (
              <span className="flex items-center justify-center">
                <LoaderIcon className="w-5 h-5 animate-spin mr-2" />
                Verifying...
              </span>
            ) : (
              'Verify Email'
            )}
          </motion.button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-sm text-text-secondary mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={isResending || isVerifying}
              className="text-accent hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <span className="flex items-center justify-center">
                  <LoaderIcon className="w-4 h-4 animate-spin mr-1" />
                  Sending...
                </span>
              ) : (
                'Resend OTP'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
