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

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 animate-page-enter">
      <div className="w-full max-w-sm bg-white border border-line rounded-card p-8">
        {/* Brand Header */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-7 h-7 rounded bg-safetyYellow flex items-center justify-center font-bold text-ink text-sm">
            C
          </div>
          <span className="font-bold text-lg text-ink">CampusFix</span>
        </div>

        <h1 className="text-xl font-bold text-ink">Log in</h1>
        <p className="text-xs text-gray-500 mt-1 mb-6">Use your campus account.</p>

        {error && (
          <div className="mb-4 p-3 bg-[#FDEDEB] border border-[#F8B4B4] rounded text-xs text-statusOpen font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. amina@example.com"
              className="w-full px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-teal"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-teal"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded shadow-none btn-interactive flex items-center justify-center disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Log in
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-teal">
          <Link to="/register" className="hover:underline">
            New here? Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
