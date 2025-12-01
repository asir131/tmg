import React from 'react';
import { Link } from 'react-router-dom';
import { FacebookIcon, InstagramIcon } from 'lucide-react';
import { SiTiktok } from 'react-icons/si';
import { SafeImage } from '../SafeImage';

export function Footer() {
  return (
    <footer className="premium-gradient py-12 mt-16">
      <div className="container-premium mx-auto px-4">
        {/* Flex container for columns */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 text-left">
          
          {/* Brand Logo and Description */}
          <div className="flex flex-col items-start max-w-xs">
            <SafeImage
              src="/Simplification.svg"
              alt="Brand Logo"
              className="w-50 mb-4 -ml-4 -mt-8"
            />
            <p className="text-text-secondary">
              The premier destination for premium competitions with incredible prizes.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="https://web.facebook.com/?_rdc=1&_rdr#" className="text-text-secondary hover:text-white transition-colors">
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/" className="text-text-secondary hover:text-white transition-colors">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="https://www.tiktok.com/explore" className="text-text-secondary hover:text-white transition-colors">
                <SiTiktok className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-start">
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-text-secondary hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/competitions" className="text-text-secondary hover:text-white transition-colors">
                  All Competitions
                </Link>
              </li>
              <li>
                <Link to="/winners" className="text-text-secondary hover:text-white transition-colors">
                  Winners
                </Link>
              </li>
              <li>
                <Link to="/live-draws" className="text-text-secondary hover:text-white transition-colors">
                  Live Draws
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="flex flex-col items-start">
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-text-secondary hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="text-text-secondary hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-text-secondary hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-text-secondary">
          <p>© {new Date().getFullYear()} TMG Competitions. – Company No: 11767558</p>
        </div>
      </div>
    </footer>
  );
}
