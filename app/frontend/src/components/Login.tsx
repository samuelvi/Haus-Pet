import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from './Navbar';

export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('admin@hauspet.com');
  const [password, setPassword] = useState<string>('Admin123');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Navigation */}
      <Navbar />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5ede7] via-[#faf7f4] to-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#d67747] rounded-3xl mb-6 shadow-[0_8px_30px_0_rgba(58,40,18,0.16)]">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-[#3a2812] mb-3 tracking-tight">HausPet Admin</h1>
          <p className="text-base text-[#5a4733]">Sign in to manage your pet shelter</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_0_rgba(58,40,18,0.16)] border border-[#e8cfc1] overflow-hidden">
          <div className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#3a2812] mb-3">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#cfc0b3] bg-white text-[#3a2812] placeholder:text-[#9d8570] focus:border-[#d67747] focus:ring-4 focus:ring-[#d67747]/20 focus:outline-none transition-all duration-200 text-base"
                  placeholder="admin@hauspet.com"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#3a2812] mb-3">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#cfc0b3] bg-white text-[#3a2812] placeholder:text-[#9d8570] focus:border-[#d67747] focus:ring-4 focus:ring-[#d67747]/20 focus:outline-none transition-all duration-200 text-base"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-semibold text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-[#d67747] text-white font-semibold text-base hover:bg-[#c45a2f] focus:outline-none focus:ring-4 focus:ring-[#d67747]/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="pt-6 border-t-2 border-[#e8cfc1]">
              <div className="bg-[#fdf5e1] rounded-xl p-5 border-2 border-[#fae9b8]">
                <p className="text-xs font-bold text-[#54380b] uppercase tracking-wider mb-3">
                  Demo Credentials
                </p>
                <div className="space-y-2 text-sm text-[#54380b]">
                  <p className="flex items-baseline gap-2">
                    <span className="font-semibold min-w-[80px]">Email:</span>
                    <span className="font-mono text-xs bg-white/60 px-2 py-1 rounded">admin@hauspet.com</span>
                  </p>
                  <p className="flex items-baseline gap-2">
                    <span className="font-semibold min-w-[80px]">Password:</span>
                    <span className="font-mono text-xs bg-white/60 px-2 py-1 rounded">Admin123</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#5a4733] mt-8">
          Need help? Contact{' '}
          <a href="mailto:support@hauspet.com" className="font-semibold text-[#d67747] hover:text-[#c45a2f] underline decoration-2 underline-offset-2 transition-colors">
            support@hauspet.com
          </a>
        </p>
        </div>
      </div>
    </>
  );
};
