// frontend/src/components/UserDrawer.jsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { ACADEMIC_PROGRAMMES, STANDARD_LEVELS } from '../data/academicData';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'staff', label: 'Staff member' },
  { value: 'maintenance', label: 'Maintenance staff' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
];

export default function UserDrawer({ isOpen, onClose, onSubmit, allowedRoles = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    programme: 'Undergraduate',
    faculty: '',
    department: '',
    student_id: '',
    levelOption: '100 Level',
    customLevel: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visible, setVisible] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!visible) return null;

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

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const finalLevel = formData.levelOption === 'Other' ? formData.customLevel.trim() : formData.levelOption;
      await onSubmit({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        faculty: formData.faculty,
        department: formData.department,
        student_id: formData.student_id,
        level: finalLevel,
      });
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        programme: 'Undergraduate',
        faculty: '',
        department: '',
        student_id: '',
        levelOption: '100 Level',
        customLevel: '',
      });
      onClose();
    } catch (err) {
      setErrors((prev) => ({ ...prev, server: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClass = "w-full px-3.5 py-2.5 text-sm bg-white border border-line rounded-lg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal font-medium text-ink transition-colors cursor-pointer";
  const inputClass = "w-full px-3.5 py-2.5 text-sm bg-white border border-line rounded-lg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal text-ink transition-colors";

  // Filter roles based on allowed roles
  const availableRoles = ROLE_OPTIONS.filter((opt) => allowedRoles.includes(opt.value));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 ${closing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen max-w-lg bg-white border-l border-line p-6 flex flex-col justify-between overflow-y-auto ${closing ? 'animate-drawer-out' : 'animate-drawer-in'}`}>
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <h2 className="text-xl font-bold text-ink">Create new account</h2>
                <p className="text-xs text-gray-500 mt-0.5">Add a new campus user with custom credentials and roles.</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-ink focus:outline-none p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {errors.server && (
              <div className="mt-4 p-3 bg-red-50 text-statusOpen text-xs rounded-lg border border-red-200">
                {errors.server}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Full name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                />
                {errors.name && <p className="mt-1 text-xs text-statusOpen">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Email address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                />
                {errors.email && <p className="mt-1 text-xs text-statusOpen">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-ink">Account password</label>
                  <span className="text-[11px] text-gray-400">User will use this to sign in</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-statusOpen">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Assigned role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={selectClass}
                >
                  {availableRoles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Academic details inputs */}
              <div className="pt-3 border-t border-line space-y-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal">Academic Details (Optional)</h3>
                  <p className="text-[11px] text-gray-400">Set faculty, department, and level for student or staff accounts.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Programme</label>
                    <select
                      value={formData.programme}
                      onChange={(e) => handleProgrammeChange(e.target.value)}
                      className={selectClass}
                    >
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Level</label>
                    <select
                      value={formData.levelOption}
                      onChange={(e) => setFormData({ ...formData, levelOption: e.target.value })}
                      className={selectClass}
                    >
                      {STANDARD_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.levelOption === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Specify Level</label>
                    <input
                      type="text"
                      value={formData.customLevel}
                      onChange={(e) => setFormData({ ...formData, customLevel: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Faculty</label>
                    <select
                      value={formData.faculty}
                      onChange={(e) => handleFacultyChange(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select Faculty...</option>
                      {currentFaculties.map((fac) => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      disabled={!formData.faculty}
                      className={`${selectClass} disabled:opacity-50`}
                    >
                      <option value="">Select Department...</option>
                      {currentDepartments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-ink">
                      {formData.role === 'student' ? 'Matric Number' : 'Staff ID / Identifier'}
                    </label>
                    {formData.role === 'student' && (
                      <span className="text-[10px] text-gray-500 font-mono">Max 9 digits</span>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode={formData.role === 'student' ? 'numeric' : 'text'}
                    value={formData.student_id}
                    onChange={(e) => {
                      const val = formData.role === 'student'
                        ? e.target.value.replace(/\D/g, '').slice(0, 9)
                        : e.target.value;
                      setFormData({ ...formData, student_id: val });
                    }}
                    maxLength={formData.role === 'student' ? 9 : 60}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-line">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-semibold border border-line rounded-lg text-ink hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-5 py-2.5 text-sm font-bold bg-teal hover:bg-teal-dark text-white rounded-lg btn-interactive disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  Create account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
