// frontend/src/pages/UsersPage.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import UserDrawer from '../components/UserDrawer';
import Toast from '../components/Toast';
import ErrorBanner from '../components/ErrorBanner';
import { Plus, UserCheck, Shield } from 'lucide-react';

const ROLES = ['student', 'staff', 'maintenance', 'admin', 'super_admin'];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadUsers = async () => {
    try {
      setError(null);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
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
      setToast({ type: 'success', message: `User role updated to ${newRole}.` });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Could not update user role.' });
    }
  };

  const handleCreateUser = async (userData) => {
    const res = await api.createUser(userData);
    setUsers((prev) => [res.user, ...prev]);
    setToast({ type: 'success', message: `Account created for ${res.user.email}.` });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-page-enter">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">User Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Super admin controls: view accounts, provision roles, and manage permissions.
          </p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded shadow-none btn-interactive"
        >
          <Plus size={16} className="mr-1.5" />
          Create user
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadUsers} />}

      <div className="bg-white border border-line rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead className="bg-[#FAFBFB] text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {users.map((u) => {
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="table-row-hover">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-ink text-sm flex items-center">
                        {u.name}
                        {isSelf && (
                          <span className="ml-2 text-[10px] bg-teal-light text-teal font-bold px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                      {u.email}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {isSelf ? (
                        <span className="text-xs text-gray-400 italic">Self role fixed</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-line rounded focus:outline-none focus:border-teal bg-white"
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
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

      <UserDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleCreateUser}
      />
    </div>
  );
}
