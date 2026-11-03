// frontend/src/pages/UsersPage.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import ErrorBanner from '../components/ErrorBanner';
import UserDrawer from '../components/UserDrawer';

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
  const [createOpen, setCreateOpen] = useState(false);

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

  const handleDeleteUser = async (target) => {
    const confirmed = window.confirm(`Delete ${target.name} and all reports created by this account? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await api.deleteUser(target.id);
      setUsers((previous) => previous.filter((user) => user.id !== target.id));
      setTotalUsers((count) => Math.max(0, count - 1));
      setToast({ type: 'success', message: 'User account deleted.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Could not delete user account.' });
    }
  };

  const handleCreateUser = async (formData) => {
    const res = await api.createUser(formData);
    setUsers((prev) => [res.user, ...prev]);
    setTotalUsers((count) => count + 1);
    setToast({ type: 'success', message: 'Account created successfully.' });
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
        <div className="flex items-center gap-3">
          <div className="rounded-card border border-line bg-white px-5 py-3 card-interactive">
            <p className="text-sm font-semibold text-gray-600">Accounts on CampusFix</p>
            <p className="text-2xl font-bold text-ink">{totalUsers}</p>
          </div>
          <button type="button" onClick={() => setCreateOpen(true)} className="rounded bg-teal px-4 py-3 text-sm font-bold text-white hover:bg-teal-dark btn-interactive">
            Create user
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadUsers} />}

      {/* Main 2-column layout matching Image 07 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: User list table */}
        <div className="lg:col-span-12 bg-white border border-line rounded-card overflow-hidden card-interactive">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-left text-sm">
              <thead className="bg-[#FAFBFB] text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Account</th>
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
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="w-44 px-3 py-1.5 text-xs border border-line rounded bg-white text-ink focus:outline-none focus:border-teal font-medium"
                          >
                            {ROLES.filter((r) => currentUser.role === 'super_admin' || r.value !== 'super_admin').map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {!isSelf && (currentUser.role === 'super_admin' || u.role !== 'super_admin') && (
                          <button type="button" onClick={() => handleDeleteUser(u)} className="rounded border border-statusOpen/30 px-3 py-1.5 text-sm font-semibold text-statusOpen hover:bg-statusOpen hover:text-white btn-interactive">
                            Delete user
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      <UserDrawer
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateUser}
        allowedRoles={ROLES.filter((role) => currentUser.role === 'super_admin' || role.value !== 'super_admin').map((role) => role.value)}
      />
    </div>
  );
}
