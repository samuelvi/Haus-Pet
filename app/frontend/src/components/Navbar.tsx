import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/gallery" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-accent-600 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span className="text-2xl">🐾</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-secondary-500 to-accent-600 bg-clip-text text-transparent">
              HausPet
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            <Link
              to="/gallery"
              className={`px-5 py-2 rounded-lg font-semibold transition-all duration-200 ${
                isActive('/gallery')
                  ? 'bg-gradient-to-r from-secondary-500 to-accent-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-primary-50'
              }`}
            >
              🏠 Home
            </Link>
            <Link
              to="/login"
              className={`px-5 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                isActive('/login')
                  ? 'bg-gradient-to-r from-secondary-500 to-accent-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-primary-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
