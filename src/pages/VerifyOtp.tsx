import React, { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGetMeQuery, useVerifyOtpMutation } from '../store/api/authApi';

const OTP_LENGTH = 6;

export function VerifyOtp() {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackEmail = (location.state as { email?: string } | null)?.email;
  const { data: user } = useGetMeQuery();
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();

  const code = useMemo(() => digits.join(''), [digits]);
  const isComplete = useMemo(() => digits.every((digit) => digit !== ''), [digits]);

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const handleChange = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextValue;
    setDigits(nextDigits);
    setErrorMessage(null);

    if (nextValue && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') {
      return;
    }

    if (digits[index]) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    if (index > 0) {
      focusInput(index - 1);
      const nextDigits = [...digits];
      nextDigits[index - 1] = '';
      setDigits(nextDigits);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }

    const nextDigits = Array(OTP_LENGTH)
      .fill('')
      .map((_, index) => pasted[index] || '');
    setDigits(nextDigits);
    setErrorMessage(null);

    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    focusInput(nextIndex);
    event.preventDefault();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isComplete) {
      setErrorMessage('Enter the 6-digit code we sent you.');
      return;
    }

    try {
      setErrorMessage(null);
      const email = user?.email;
      if (!email) {
        setErrorMessage('Unable to verify without an email on your account.');
        return;
      }

      await verifyOtp({ otp: code, email }).unwrap();
      navigate('/login');
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        'Unable to verify the code. Please try again.';
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="container-premium">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="card-premium p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
              <p className="text-text-secondary">
                {user?.email || fallbackEmail
                  ? `We sent a 6-digit code to ${user?.email || fallbackEmail}.`
                  : 'Enter the 6-digit code we sent you.'}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-center gap-3">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    value={digit}
                    onChange={(event) => handleChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={handlePaste}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    className="w-12 h-14 text-center text-xl font-semibold bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>
              {errorMessage && (
                <p className="text-red-500 text-sm text-center">{errorMessage}</p>
              )}
              <motion.button
                type="submit"
                className="w-full btn-premium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!isComplete || isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </motion.button>
            </form>
            <div className="mt-6 text-center text-sm text-text-secondary">
              Didn&apos;t receive the code?{' '}
              <button type="button" className="text-accent hover:underline">
                Resend
              </button>
            </div>
            <div className="mt-4 text-center text-sm text-text-secondary">
              <Link to="/login" className="text-accent hover:underline">
                Back to login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
