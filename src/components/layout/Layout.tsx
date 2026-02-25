import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({
  children
}: LayoutProps) {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.fbq !== 'undefined') {
      window.fbq!('track', 'PageView');
    }
  }, [location.pathname]);

  return <div className="flex flex-col min-h-screen bg-base">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>;
}