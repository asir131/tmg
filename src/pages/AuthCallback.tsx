import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const redirect = searchParams.get('redirect');

    if (!token || !refreshToken) {
      setError('Missing tokens from login. Please try again.');
      return;
    }

    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);

    const target = redirect && redirect.startsWith('/') ? redirect : '/';
    window.location.replace(target);
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="container-premium">
          <div className="max-w-md mx-auto card-premium p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn-premium"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="container-premium">
        <div className="max-w-md mx-auto card-premium p-8 text-center">
          <p className="text-text-secondary">Signing you in...</p>
        </div>
      </div>
    </div>
  );
}
