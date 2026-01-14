import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailIcon } from 'lucide-react';
import { useForgotPasswordMutation } from '../store/api/authApi';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiMessage(null);
    setApiErrorMessage(null);

    try {
      const response = await forgotPassword({ email }).unwrap();
      setApiMessage(response.data?.message || response.message);
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        'Unable to send reset link. Please try again.';
      setApiErrorMessage(message);
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
              <h1 className="text-3xl font-bold mb-2">Forgot Password</h1>
              <p className="text-text-secondary">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <MailIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>
              {apiMessage && (
                <p className="text-green-500 text-sm text-center">{apiMessage}</p>
              )}
              {apiErrorMessage && (
                <p className="text-red-500 text-sm text-center">{apiErrorMessage}</p>
              )}
              <motion.button
                type="submit"
                className="w-full btn-premium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Reset Password'}
              </motion.button>
            </form>
            <div className="mt-6 text-center text-sm text-text-secondary">
              Remembered your password?{' '}
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
