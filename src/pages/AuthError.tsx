import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export function AuthError() {
  const [searchParams] = useSearchParams();
  const rawMessage = searchParams.get('message');
  const message = rawMessage
    ? (() => {
        try {
          return decodeURIComponent(rawMessage);
        } catch {
          return rawMessage;
        }
      })()
    : 'Something went wrong during sign in. Please try again.';

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="container-premium">
        <div className="max-w-md mx-auto card-premium p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Sign in failed</h1>
          <p className="text-text-secondary mb-6">{message}</p>
          <Link to="/login" className="btn-premium inline-block">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
