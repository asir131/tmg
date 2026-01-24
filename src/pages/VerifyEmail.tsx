import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, AlertCircleIcon, MailIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verificationStatus = searchParams.get('status');
    const errorMessage = searchParams.get('message');

    if (verificationStatus === 'success') {
      setStatus('success');
      setMessage('Your email has been verified successfully! You can now log in to your account.');
      
      // Auto-redirect to login after 5 seconds
      const timer = setTimeout(() => {
        navigate('/login');
      }, 5000);
      
      return () => clearTimeout(timer);
    } else if (verificationStatus === 'error') {
      setStatus('error');
      const decodedMessage = errorMessage ? decodeURIComponent(errorMessage) : 'Email verification failed.';
      setMessage(decodedMessage);
    } else {
      // No status parameter - user might have navigated directly
      setStatus('invalid');
      setMessage('Invalid verification link. Please check your email for the correct verification link.');
    }
  }, [searchParams, navigate]);

  if (status === 'loading') {
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
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
                  <MailIcon className="w-8 h-8 text-accent animate-pulse" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Verifying Email...</h1>
                <p className="text-text-secondary">
                  Please wait while we verify your email address.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold mb-2 text-green-500">Email Verified!</h1>
                <p className="text-text-secondary mb-6">
                  {message}
                </p>
                <p className="text-sm text-text-secondary mb-6">
                  Redirecting to login page in 5 seconds...
                </p>
              </div>
              <div className="space-y-3">
                <motion.button
                  onClick={() => navigate('/login')}
                  className="w-full btn-premium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Go to Login
                </motion.button>
                <Link
                  to="/"
                  className="block w-full text-center py-3 px-4 rounded-xl bg-gradient-end border border-gray-700 hover:border-accent transition-colors text-text-secondary hover:text-white"
                >
                  Go to Home
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                  <XCircleIcon className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold mb-2 text-red-500">Verification Failed</h1>
                <p className="text-text-secondary mb-6">
                  {message}
                </p>
                {message.includes('expired') && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircleIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm text-yellow-500 font-medium mb-1">Link Expired</p>
                        <p className="text-xs text-text-secondary">
                          Verification links expire after 24 hours. Please register again or contact support if you need assistance.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {message.includes('already been used') && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm text-blue-500 font-medium mb-1">Already Verified</p>
                        <p className="text-xs text-text-secondary">
                          This verification link has already been used. Your account may already be verified. Try logging in.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <motion.button
                  onClick={() => navigate('/signup')}
                  className="w-full btn-premium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Register Again
                </motion.button>
                <motion.button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-end border border-gray-700 hover:border-accent transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Go to Login
                </motion.button>
                <Link
                  to="/"
                  className="block w-full text-center py-3 px-4 rounded-xl bg-gradient-end border border-gray-700 hover:border-accent transition-colors text-text-secondary hover:text-white"
                >
                  Go to Home
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Invalid status
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
                <AlertCircleIcon className="w-8 h-8 text-yellow-500" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Invalid Link</h1>
              <p className="text-text-secondary mb-6">
                {message}
              </p>
            </div>
            <div className="space-y-3">
              <motion.button
                onClick={() => navigate('/signup')}
                className="w-full btn-premium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Register
              </motion.button>
              <Link
                to="/login"
                className="block w-full text-center py-3 px-4 rounded-xl bg-gradient-end border border-gray-700 hover:border-accent transition-colors text-text-secondary hover:text-white"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
