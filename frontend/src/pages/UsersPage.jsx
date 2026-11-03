// frontend/src/pages/UsersPage.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import ErrorBanner from '../components/ErrorBanner';
import { Loader2 } from 'lucide-react';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'staff', label: 'Staff member' },
  { value: 'maintenance', label: 'Maintenance staff' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Create account card form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'maintenance',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setError(null);
      const data = await api.getUsers();
      setUsers(data.users);
      setTotalUsers(data.total);
    } catch (err) {
      setError(err.message || "Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const res = await api.updateUserRole(targetUserId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: res.user.role } : u))
      );
      setToast({ type: 'success', message: 'User role updated.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Could not update user role.' });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    if (!formData.password || formData.password.length < 8) {
      errs.password = 'At least 8 characters';
    }
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await api.createUser(formData);
      setUsers((prev) => [res.user, ...prev]);
      setTotalUsers((count) => count + 1);
      setFormData({ name: '', email: '', password: '', role: 'maintenance' });
      setToast({ type: 'success', message: 'Account created successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Could not create account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-page-enter">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage campus accounts and roles.</p>
        </div>
        <div className="rounded-card border border-line bg-white px-5 py-3 card-interactive">
          <p className="text-xs text-gray-500">Accounts on CampusFix</p>
          <p className="text-2xl font-bold text-ink">{totalUsers}</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadUsers} />}

      {/* Main 2-column layout matching Image 07 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: User list table */}
        <div className={`${currentUser.role === 'admin' ? 'lg:col-span-12' : 'lg:col-span-8'} bg-white border border-line rounded-card overflow-hidden card-interactive`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-left text-sm">
              <thead className="bg-[#FAFBFB] text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {users.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className="table-row-hover">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-semibold text-ink text-sm">
                          {u.name} {isSelf && '(you)'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                        {u.email}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isSelf ? (
                          <div className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 font-medium rounded border border-gray-200 inline-block min-w-36">
                            {ROLES.find((role) => role.value === u.role)?.label} (you)
                          </div>
                        ) : currentUser.role === 'admin' ? (
                          ['student', 'staff'].includes(u.role) ? (
                            <button onClick={() => handleRoleChange(u.id, 'admin')} className="rounded border border-teal/30 bg-white px-3 py-1.5 text-xs font-semibold text-teal hover:bg-teal hover:text-white btn-interactive">
                              Promote to admin
                            </button>
                          ) : (
                            <span className="inline-flex min-w-36 justify-center rounded border border-line bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                              {ROLES.find((role) => role.value === u.role)?.label}
                            </span>
                          )
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="w-44 px-3 py-1.5 text-xs border border-line rounded bg-white text-ink focus:outline-none focus:border-teal font-medium"
                          >
                            {ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      {/* Only super admins can provision privileged accounts. */}
      {currentUser.role === 'super_admin' && <div className="lg:col-span-4 bg-white border border-line rounded-card p-6 card-interactive">
          <h2 className="text-base font-bold text-ink">Create account</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-5">
            Students and staff register themselves.
          </p>

          <form onSubmit={handleCreateUser} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Full name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                className="w-full px-3 py-2 text-xs border border-line rounded focus:outline-none focus:border-teal"
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-statusOpen">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-xs border border-line rounded focus:outline-none focus:border-teal"
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-statusOpen">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Temporary password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 text-xs border border-line rounded focus:outline-none focus:border-teal"
              />
              {formErrors.password && (
                <p className="mt-1 text-xs text-statusOpen">{formErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-line rounded bg-white text-ink focus:outline-none focus:border-teal font-medium"
              >
                {ROLES.filter((r) => r.value !== 'student' && r.value !== 'staff').map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-teal hover:bg-teal-dark text-white text-xs font-semibold rounded shadow-none btn-interactive flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                Create account
              </button>
            </div>
          </form>
        </div>}
      </div>
    </div>
  );
}
