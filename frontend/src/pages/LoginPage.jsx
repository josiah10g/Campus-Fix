// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Invalid email or password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/issues');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for testing / defense demo
  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('DemoPass123!');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 animate-page-enter">
      <div className="w-full max-w-md bg-white border border-line rounded-card p-8 sm:p-10 shadow-sm">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-9 h-9 rounded bg-safetyYellow flex items-center justify-center font-bold text-ink text-lg shadow-none">
            C
          </div>
          <span className="font-bold text-2xl tracking-tight text-ink">CampusFix</span>
        </div>

        <h1 className="text-2xl font-bold text-ink tracking-tight">Log in</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">Use your campus account.</p>

        {error && (
          <div className="mb-5 p-3.5 bg-[#FDEDEB] border border-[#F8B4B4] rounded text-sm text-statusOpen font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. amina@example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded shadow-none btn-interactive flex items-center justify-center disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Log in
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-teal font-medium">
          <Link to="/register" className="hover:underline">
            New here? Create an account
          </Link>
        </div>

        {/* Quick Demo Helper Chips */}
        <div className="mt-8 pt-5 border-t border-line">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
            Quick demo login (click to autofill):
          </p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillDemo('amina@example.com')}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => fillDemo('tunde@example.com')}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium"
            >
              Maintenance
            </button>
            <button
              type="button"
              onClick={() => fillDemo('grace@example.com')}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
