// frontend/src/pages/UsersPage.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import ErrorBanner from '../components/ErrorBanner';
import UserDrawer from '../components/UserDrawer';
import { AlertTriangle, Trash2, X, ChevronDown } from 'lucide-react';

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

  // In-app card modal state for deleting a user
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.deleteUser(deleteTarget.id);
      setUsers((previous) => previous.filter((user) => user.id !== deleteTarget.id));
      setTotalUsers((count) => Math.max(0, count - 1));
      setToast({ type: 'success', message: `User ${deleteTarget.name} has been deleted.` });
      setDeleteTarget(null);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Could not delete user account.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateUser = async (formData) => {
    const res = await api.createUser(formData);
    setUsers((prev) => [res.user, ...prev]);
    setTotalUsers((count) => count + 1);
    setToast({ type: 'success', message: 'Account created successfully.' });
  };

  const formatLevel = (lvl) => {
    if (!lvl) return '';
    const clean = String(lvl).trim();
    const match = clean.match(/^(\d+)/);
    if (match) return `${match[1]}LVL`;
    return clean.toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-page-enter">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage campus accounts, academic affiliations, and roles.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-card border border-line bg-white px-5 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Accounts on CampusFix</p>
            <p className="text-2xl font-bold text-ink">{totalUsers}</p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded bg-teal px-5 py-3 text-sm font-bold text-white hover:bg-teal-dark btn-interactive shadow-sm"
          >
            Create user
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadUsers} />}

      {/* User list table */}
      <div className="bg-white border border-line rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-[#FAFBFB] text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-4 py-3.5">Department & Level</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5 text-right">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {users.map((u) => {
                const isSelf = u.id === currentUser.id;
                const lvl = formatLevel(u.level);
                const dept = (u.department || u.faculty || '').toUpperCase();

                return (
                  <tr key={u.id} className="table-row-hover">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-semibold text-ink text-sm">
                        {u.name} {isSelf && <span className="text-teal font-bold">(you)</span>}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                      {u.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs">
                      {lvl || dept ? (
                        <div className="flex flex-col">
                          {lvl && (
                            <span className="text-teal font-bold uppercase tracking-wide">
                              {lvl}
                            </span>
                          )}
                          {dept && (
                            <span className="text-gray-600 font-semibold uppercase tracking-wide mt-0.5 truncate max-w-[200px]" title={dept}>
                              {dept}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {isSelf ? (
                        <div className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 font-semibold rounded border border-gray-200 inline-block min-w-36">
                          {ROLES.find((role) => role.value === u.role)?.label} (you)
                        </div>
                      ) : (
                        <div className="relative inline-block w-48">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="w-full appearance-none px-3.5 py-1.5 pr-8 text-xs font-semibold border border-line rounded-lg bg-white text-ink focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal cursor-pointer transition-colors shadow-none"
                          >
                            {ROLES.filter((r) => currentUser.role === 'super_admin' || r.value !== 'super_admin').map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!isSelf && (currentUser.role === 'super_admin' || u.role !== 'super_admin') && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(u)}
                          className="rounded border border-statusOpen/30 px-3 py-1.5 text-xs font-semibold text-statusOpen hover:bg-statusOpen hover:text-white btn-interactive"
                        >
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

      <UserDrawer
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateUser}
        allowedRoles={ROLES.filter((role) => currentUser.role === 'super_admin' || role.value !== 'super_admin').map((role) => role.value)}
      />

      {/* In-app Card Notification Modal for Deleting User */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-card border border-line bg-white p-6 shadow-xl animate-scale-in">
            <div className="flex items-start justify-between pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-statusOpen">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">Delete User Account</h3>
                  <p className="text-xs text-gray-500">This action is permanent and cannot be undone.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-gray-400 hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="my-4 rounded border border-red-200 bg-red-50/60 p-3 text-sm text-red-900">
              Are you sure you want to delete <span className="font-semibold text-ink">{deleteTarget.name}</span> ({deleteTarget.email})? All reports and logs created by this account will also be affected.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteTarget(null)}
                className="rounded border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-gray-50 btn-interactive"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDeleteUser}
                className="inline-flex items-center gap-2 rounded bg-statusOpen px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 btn-interactive disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deleteLoading ? 'Deleting...' : 'Yes, delete user'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
