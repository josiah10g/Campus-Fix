// frontend/src/components/UserDrawer.jsx
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

const ROLES = ['student', 'staff', 'maintenance', 'admin', 'super_admin'];

export default function UserDrawer({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });
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
      await onSubmit(formData);
      setFormData({ name: '', email: '', password: '', role: 'staff' });
      onClose();
    } catch (err) {
      setErrors((prev) => ({ ...prev, server: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 ${closing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen max-w-md bg-white border-l border-line p-6 flex flex-col justify-between ${closing ? 'animate-drawer-out' : 'animate-drawer-in'}`}>
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <h2 className="text-lg font-bold text-ink">Create new account</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-ink focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {errors.server && (
              <div className="mt-4 p-3 bg-red-50 text-statusOpen text-xs rounded border border-red-200">
                {errors.server}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Full name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-teal"
                />
                {errors.name && <p className="mt-1 text-xs text-statusOpen">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                  className="w-full px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-teal"
                />
                {errors.email && <p className="mt-1 text-xs text-statusOpen">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Temporary password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-teal"
                />
                {errors.password && <p className="mt-1 text-xs text-statusOpen">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-line rounded focus:outline-none focus:border-teal"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium border border-line rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium bg-teal hover:bg-teal-dark text-white rounded btn-interactive disabled:opacity-50"
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

