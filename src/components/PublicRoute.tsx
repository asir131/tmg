import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const PublicRoute: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('accessToken');

  return isAuthenticated ? <Navigate to="/home" /> : <Outlet />;
};
