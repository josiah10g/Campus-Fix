// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';
import { ACADEMIC_PROGRAMMES, STANDARD_LEVELS } from '../data/academicData';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'student', // student or staff
    programme: 'Undergraduate', // Undergraduate or Postgraduate
    faculty: '',
    department: '',
    student_id: '',
    levelOption: '100 Level',
    customLevel: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const currentFaculties = Object.keys(ACADEMIC_PROGRAMMES[formData.programme] || {});
  const currentDepartments = formData.faculty ? (ACADEMIC_PROGRAMMES[formData.programme]?.[formData.faculty] || []) : [];

  const handleProgrammeChange = (prog) => {
    setFormData((prev) => ({
      ...prev,
      programme: prog,
      faculty: '',
      department: '',
    }));
  };

  const handleFacultyChange = (fac) => {
    setFormData((prev) => ({
      ...prev,
      faculty: fac,
      department: '',
    }));
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
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    let finalLevel = '';
    if (formData.role === 'student') {
      finalLevel = formData.levelOption === 'Other' ? formData.customLevel.trim() : formData.levelOption;
      if (!formData.faculty.trim() || !formData.department.trim() || !formData.student_id.trim() || !finalLevel) {
        setError('Faculty, Department, Matric Number, and Level are all required for student accounts.');
        return;
      }
      if (!/^\d{9}$/.test(formData.student_id.trim())) {
        setError('Matric number must be exactly 9 digits (numbers only).');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        faculty: formData.faculty,
        department: formData.department,
        student_id: formData.student_id,
        level: finalLevel,
      });

      if (res && res.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        return;
      }

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
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </header>

      {/* Main Register Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Context Column */}
          <div className="lg:col-span-5 text-left hidden lg:block">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal/10 border border-teal/20 rounded-full text-xs font-semibold text-teal mb-4">
              <ShieldCheck size={14} /> Official Campus Issue Tracker
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight mb-4">
              Join the campus <br />
              <span className="text-teal">repair network.</span>
            </h1>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              Create an account in under a minute to report facility faults, monitor work orders, and keep university spaces safe and functional.
            </p>
            <div className="space-y-4 border-t border-line pt-6 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ✓
                </div>
                <span>Direct line to campus facilities & maintenance teams.</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ✓
                </div>
                <span>Live progress updates on everything reported across campus.</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ✓
                </div>
                <span>Safe student data with faculty and department affiliation.</span>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <div className="w-full bg-white border border-line rounded-card p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-ink tracking-tight">Create your account</h2>
                <p className="text-sm text-gray-500 mt-1">Choose your campus role to get started.</p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-statusOpen text-xs rounded font-medium flex items-center gap-2 animate-shake">
                  <span className="font-bold">Error:</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Switcher */}
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Campus Role</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1F4F3] rounded border border-line">
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

                {/* Academic Profile Selection for Students */}
                {formData.role === 'student' && (
                  <div className="space-y-3 rounded-card border border-line bg-[#FAFBFB] p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {/* Programme Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">Programme</label>
                        <select
                          value={formData.programme}
                          onChange={(e) => handleProgrammeChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-line rounded focus:outline-none focus:border-teal font-medium"
                        >
                          <option value="Undergraduate">Undergraduate</option>
                          <option value="Postgraduate">Postgraduate</option>
                        </select>
                      </div>

                      {/* Faculty Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">Faculty / College</label>
                        <select
                          value={formData.faculty}
                          onChange={(e) => handleFacultyChange(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs bg-white border border-line rounded focus:outline-none focus:border-teal font-medium"
                        >
                          <option value="">Select Faculty...</option>
                          {currentFaculties.map((fac) => (
                            <option key={fac} value={fac}>{fac}</option>
                          ))}
                        </select>
                      </div>

                      {/* Department Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">Department</label>
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          disabled={!formData.faculty}
                          required
                          className="w-full px-3 py-2 text-xs bg-white border border-line rounded focus:outline-none focus:border-teal font-medium disabled:opacity-50"
                        >
                          <option value="">Select Department...</option>
                          {currentDepartments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-ink">Matric Number</label>
                          <span className="text-[10px] text-gray-500 font-mono">9 digits</span>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.student_id}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                            setFormData({ ...formData, student_id: val });
                          }}
                          placeholder="e.g. 210902041"
                          maxLength={9}
                          className="w-full px-3 py-2 text-xs bg-white border border-line rounded focus:outline-none focus:border-teal font-mono tracking-wider"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">Level</label>
                        <select
                          value={formData.levelOption}
                          onChange={(e) => setFormData({ ...formData, levelOption: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white border border-line rounded focus:outline-none focus:border-teal font-medium"
                        >
                          {STANDARD_LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                        {formData.levelOption === 'Other' && (
                          <input
                            type="text"
                            value={formData.customLevel}
                            onChange={(e) => setFormData({ ...formData, customLevel: e.target.value })}
                            placeholder="Specify your level (e.g. 600 Level / PhD Yr 2)"
                            maxLength={40}
                            required
                            className="mt-2 w-full px-3 py-2 text-xs bg-white border border-line rounded focus:outline-none focus:border-teal"
                          />
                        )}
                      </div>
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
                      placeholder="Enter a secure password"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBFB] focus:bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal pr-10 transition-all"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      placeholder="Repeat your password"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBFB] focus:bg-white border border-line rounded focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal pr-10 transition-all"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-teal hover:bg-teal-dark text-white font-bold text-sm rounded shadow-none btn-interactive flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-line text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to={`/login${nextParam}`} className="text-teal font-bold hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-line py-5 text-center text-xs text-gray-500 bg-white">
        © 2026 CampusFix. Facility Management & Issue Resolution Portal.
      </footer>
    </div>
  );
}
