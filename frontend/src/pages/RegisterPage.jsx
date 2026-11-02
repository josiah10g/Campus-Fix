// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student', // student or staff
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/issues');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 animate-page-enter">
      <div className="w-full max-w-sm bg-white border border-line rounded-card p-8">
        {/* Brand Header */}
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-7 h-7 rounded bg-safetyYellow flex items-center justify-center font-bold text-ink text-sm">
            C
          </div>
          <span className="font-bold text-lg text-ink">CampusFix</span>
        </div>

        <h1 className="text-xl font-bold text-ink">Create your account</h1>
        <p className="text-xs text-gray-500 mt-1 mb-6">Students and staff can register here.</p>

        {error && (
          <div className="mb-4 p-3 bg-[#FDEDEB] border border-[#F8B4B4] rounded text-xs text-statusOpen font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Full name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Amina Yusuf"
              className="w-full px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-teal"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-teal"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-teal"
              required
            />
            <span className="text-[11px] text-gray-400 mt-0.5 block">At least 8 characters</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2">I am a</label>
            <div className="flex items-center space-x-6 text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="text-teal focus:ring-teal h-4 w-4"
                />
                <span className="ml-2 text-xs font-medium text-ink">Student</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="staff"
                  checked={formData.role === 'staff'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="text-teal focus:ring-teal h-4 w-4"
                />
                <span className="ml-2 text-xs font-medium text-ink">Staff member</span>
              </label>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border border-line rounded text-[11px] text-gray-500">
            Maintenance and admin accounts are created by the super admin.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded shadow-none btn-interactive flex items-center justify-center disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create account
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-teal">
          <Link to="/login" className="hover:underline">
            Already registered? Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

