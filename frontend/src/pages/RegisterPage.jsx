// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student', // student or staff
    faculty: '',
    department: '',
    student_id: '',
    level: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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
    if (formData.role === 'student' && ['faculty', 'department', 'student_id', 'level'].some((field) => !formData[field].trim())) {
      setError('Enter your faculty, department, student ID and level.');
      return;
    }
    setLoading(true);
    try {
      await register(formData);
      const target = getSafeNext();
      if (target === '/issues') {
        navigate('/issues', { state: { welcome: true } });
      } else {
        navigate(target);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
          Go back to the home page
        </Link>
      </header>

      {/* Main 2-Column Split Layout matching inspiration Image 02 */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Campus Statement & Stats */}
          <div className="lg:col-span-5 text-left py-4">
            <div className="inline-flex items-center gap-2 text-sm font-bold tracking-wider uppercase text-teal mb-3">
              <span className="w-1.5 h-3.5 bg-teal rounded-full" />
              Join CampusFix
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight mb-4 font-serif sm:font-sans">
              Report campus issues in minutes.
            </h1>

            <p className="text-base text-gray-700 leading-relaxed mb-8">
              Create your account to submit facility problems, follow live repair progress, and keep campus infrastructure safe for everyone.
            </p>

            {/* Micro Stats Row inspired by Image 02 */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-line">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-ink font-serif sm:font-sans">
                  5 Roles
                </div>
                <div className="text-sm text-gray-600 mt-1">Role-based oversight</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-teal font-serif sm:font-sans">
                  24/7
                </div>
                <div className="text-sm text-gray-600 mt-1">Open campus tracking</div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Registration Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-line rounded-card p-6 sm:p-9 shadow-sm card-interactive">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-ink tracking-tight font-serif sm:font-sans">
                  Create your account
                </h2>
                <p className="text-base text-gray-600 mt-1">
                  Choose how you use CampusFix on campus.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-[#FDEDEB] border border-[#F8B4B4] rounded text-xs sm:text-sm text-statusOpen font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Segmented Role Switcher styled after inspiration */}
                <div>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[#FAFBFB] border border-line rounded-md mb-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'student' })}
                      className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded transition-all ${
                        formData.role === 'student'
                          ? 'bg-teal text-white shadow-sm'
                          : 'text-gray-600 hover:text-ink'
                      }`}
                    >
                      <UserCheck size={14} />
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'staff' })}
                      className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded transition-all ${
                        formData.role === 'staff'
                          ? 'bg-teal text-white shadow-sm'
                          : 'text-gray-600 hover:text-ink'
                      }`}
                    >
                      <Briefcase size={14} />
                      Staff member
                    </button>
                  </div>
                </div>

                {formData.role === 'student' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">Faculty</label>
                      <input type="text" value={formData.faculty} onChange={(e) => setFormData({ ...formData, faculty: e.target.value })} placeholder="Your faculty" maxLength={100} className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBFB] focus:bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">Department</label>
                      <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="Your department" maxLength={100} className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBFB] focus:bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">Student ID</label>
                      <input type="text" value={formData.student_id} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} placeholder="Your student ID" maxLength={60} className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBFB] focus:bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">Level</label>
                      <input type="text" value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} placeholder="e.g. 200 level" maxLength={40} className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBFB] focus:bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal" required />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Full name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Amina Yusuf"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBFB] focus:bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBFB] focus:bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-ink">Password</label>
                    <span className="text-sm text-gray-500">At least 8 characters</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#FAFBFB] focus:bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
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

                {/* Trust / Security notice badge */}
                <div className="p-3 bg-[#FAFBFB] border border-line rounded text-sm text-gray-700 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-teal shrink-0" />
                  <span>Account permissions are managed by CampusFix administrators.</span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded shadow-none btn-interactive flex items-center justify-center disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create account
                  </button>
                </div>
              </form>

              <div className="mt-5 text-center text-base text-gray-700">
                Already have an account?{' '}
                <Link to={`/login${nextParam}`} className="font-semibold text-teal hover:underline ml-1">
                  Log in
                </Link>
              </div>
            </div>
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
