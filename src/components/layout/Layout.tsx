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
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', 'G-LK2JK2K63F', { page_path: location.pathname + location.search });
    }
  }, [location.pathname, location.search]);

  return <div className="flex flex-col min-h-screen bg-base">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>;
}