import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { useLoginUserMutation } from '../store/api/authApi';
export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState<any>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [loginUser, { isLoading }] = useLoginUserMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrorMessage(null);

    try {
      const response = await loginUser({ email, password }).unwrap();

      if(response.data.accessToken && response.data.refreshToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        // Redirect to the specified path or home
        navigate(redirectTo || '/');
      }

    } catch (err) {
      console.error('Failed to login:', err);
      const errorMessage = (err as any)?.data?.message || 'An unknown error occurred during login.';
      setApiErrorMessage(errorMessage);
    }
  };

  return <div className="min-h-screen flex items-center justify-center py-12">
      <div className="container-premium">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5
      }} className="max-w-md mx-auto">
          <div className="card-premium p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-text-secondary">
                Login to access your account and enter competitions
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <MailIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.email@example.com" className="w-full pl-12 pr-4 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="w-full pl-12 pr-12 py-3 bg-gradient-end rounded-xl border border-gray-700 focus:border-accent focus:outline-none transition-colors" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-white transition-colors">
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {apiErrorMessage && (
                <p className="text-red-500 text-sm mt-2 text-center">{apiErrorMessage}</p>
              )}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-700 text-accent focus:ring-accent" />
                  <span className="ml-2 text-sm">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <motion.button type="submit" className="w-full btn-premium" whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }}
            disabled={isLoading}
            >
                {isLoading ? 'Logging in...' : 'Login'}
              </motion.button>
            </form>
            <div className="mt-6 text-center text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-accent hover:underline">
                Sign up
              </Link>
            </div>
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-text-secondary">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button 
                  disabled
                  className="py-3 px-4 rounded-xl bg-gradient-end border border-gray-700 flex items-center justify-center opacity-50 cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button 
                  disabled
                  className="py-3 px-4 rounded-xl bg-gradient-end border border-gray-700 flex items-center justify-center opacity-50 cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.96-3.24-.96-1.15 0-1.92.46-2.9.96-1.25.57-2.16.5-3.08-.4C2.79 18.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>;
}
