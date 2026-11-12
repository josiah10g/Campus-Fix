// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [notRegistered, setNotRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Validate internal redirect only
  const getSafeNext = () => {
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//') && !next.includes('://')) {
      return next;
    }
    return '/issues';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setNotRegistered(false);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate(getSafeNext());
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
      if (err.data && err.data.unverified) {
        setUnverifiedEmail(err.data.email || email);
      }
      if (err.data && err.data.notRegistered) {
        setNotRegistered(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextParam = location.search;

  return (
    <div className="min-h-screen bg-page flex flex-col justify-between animate-page-enter">
      {/* Top Bar with Brand Logo and Back to Home */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5 focus:outline-none">
          <div className="w-8 h-8 rounded bg-safetyYellow flex items-center justify-center font-bold text-ink text-base shadow-none">
            C
          </div>
          <span className="font-bold text-xl tracking-tight text-ink">CampusFix</span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-line bg-white text-xs font-semibold text-ink hover:text-teal hover:border-teal/40 transition-colors btn-interactive shadow-sm"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Back to Home
        </Link>
      </header>

      {/* Main Centered Login Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Centered Green/Teal Pulse Accent Dot & Header */}
          <div className="text-center mb-7">
            <div className="inline-block w-2.5 h-2.5 rounded-full bg-teal mb-3 shadow-[0_0_10px_rgba(14,107,111,0.5)]" />
            <h1 className="text-3xl font-extrabold text-ink tracking-tight font-serif sm:font-sans">
              Welcome back
            </h1>
            <p className="text-sm text-gray-600 mt-1.5">
              Log in to track reports and manage campus issues.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-line rounded-card p-7 sm:p-9 shadow-sm">
            {error && (
              <div className="mb-5 p-3.5 bg-[#FDEDEB] border border-[#F8B4B4] rounded text-xs sm:text-sm text-statusOpen font-medium">
                <p>{error}</p>
                {unverifiedEmail && (
                  <div className="mt-2.5 pt-2 border-t border-[#F8B4B4]/50">
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                      className="inline-flex items-center gap-1 font-bold text-teal hover:underline"
                    >
                      Click here to verify your email &rarr;
                    </Link>
                  </div>
                )}
                {notRegistered && (
                  <div className="mt-2.5 pt-2 border-t border-[#F8B4B4]/50">
                    <Link
                      to={`/register?email=${encodeURIComponent(email)}`}
                      className="inline-flex items-center gap-1 font-bold text-teal hover:underline"
                    >
                      Click here to create an account &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBFB] focus:bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-ink">Password</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#FAFBFB] focus:bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Login Button on TOP of Sign up Button */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-teal hover:bg-teal-dark text-white text-base font-semibold rounded shadow-none btn-interactive flex items-center justify-center disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Log in
                </button>
                <Link
                  to={`/register${nextParam}`}
                  className="inline-flex w-full items-center justify-center rounded border border-teal px-4 py-3 text-base font-bold text-teal hover:bg-teal hover:text-white btn-interactive"
                >
                  Sign up
                </Link>
              </div>
              <p className="text-center text-sm text-gray-600">Enter your credentials above to log in, or create an account with Sign up.</p>
            </form>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="py-4 text-center text-sm text-gray-500">
        CampusFix &bull; Campus Issue Reporting and Tracking System
      </footer>
    </div>
  );
}
