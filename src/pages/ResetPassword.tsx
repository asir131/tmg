import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { useResetPasswordMutation } from '../store/api/authApi';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const resetToken = useMemo(() => {
    const tokenFromQuery = searchParams.get('token') || searchParams.get('resetToken');
    const tokenFromState = (location.state as { resetToken?: string } | null)?.resetToken;
    return tokenFromQuery || tokenFromState;
  }, [location.state, searchParams]);
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetToken) {
      setErrorMessage('Reset token is missing. Please request a new link.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    try {
      const response = await resetPassword({ token: resetToken, password }).unwrap();
      setSuccessMessage(response.message);
      navigate('/login');
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        'Unable to reset password. Please try again.';
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
              <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
              <p className="text-text-secondary">
                Create a new password for your account.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter a new password"
                    className="w-full pl-12 pr-12 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {successMessage && (
                <p className="text-green-500 text-sm text-center">{successMessage}</p>
              )}
              {errorMessage && (
                <p className="text-red-500 text-sm text-center">{errorMessage}</p>
              )}
              <motion.button
                type="submit"
                className="w-full btn-premium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </motion.button>
            </form>
            <div className="mt-6 text-center text-sm text-text-secondary">
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
