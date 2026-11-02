// frontend/src/pages/IssuesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import StatCard from '../components/StatCard';
import IssueTable from '../components/IssueTable';
import IssueCard from '../components/IssueCard';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Toast from '../components/Toast';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';

const CATEGORIES = ['All categories', 'Electrical', 'Plumbing', 'Furniture', 'Network', 'Other'];
const STATUSES = ['All statuses', 'Open', 'In Progress', 'Resolved'];

export default function IssuesPage() {
  const { user } = useAuth();
  const location = useLocation();

  // Issues & Stats State
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [viewTab, setViewTab] = useState('all'); // 'all' or 'my' or 'attention'

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Newly created highlight
  const newlyCreatedId = location.state?.newIssueId;

  // Fetch Stats and Issues
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [statsData, issuesData] = await Promise.all([
        api.getStats(),
        api.getIssues({
          status: selectedStatus,
          category: selectedCategory,
          search: search,
          myReports: viewTab === 'my',
        }),
      ]);

      setStats(statsData);
      setIssues(issuesData);
    } catch (err) {
      console.error('[IssuesPage] Load failed:', err);
      setError(err.message || 'Failed to load issues from server.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedCategory, search, viewTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle toast passed from navigation (e.g. after create or edit)
  useEffect(() => {
    if (location.state?.message) {
      setToast({ type: 'success', message: location.state.message });
      // Clear state so reload doesn't repeat toast
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Inline Status Change (Maintenance / Admin / Super Admin)
  const handleStatusChange = async (issueId, newStatus) => {
    try {
      const updated = await api.updateIssue(issueId, { status: newStatus });
      setIssues((prev) => prev.map((item) => (item.id === issueId ? updated : item)));
      // Refresh stats
      const newStats = await api.getStats();
      setStats(newStats);
      setToast({ type: 'success', message: `Status updated to ${newStatus}.` });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Could not update status.',
      });
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.deleteIssue(deleteTarget.id);
      setIssues((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      const newStats = await api.getStats();
      setStats(newStats);
      setToast({ type: 'success', message: 'Issue deleted successfully.' });
      setDeleteTarget(null);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete issue.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Caption Bar description per role based on design mockups
  const getRoleCaption = () => {
    switch (user?.role) {
      case 'student':
      case 'staff':
        return 'Student and staff: report, view everything, edit or delete only their own issues while Open. Status is read only.';
      case 'maintenance':
        return 'Maintenance: change status inline, edit any issue, view everything. Cannot delete.';
      case 'admin':
        return 'Admin: everything maintenance can do, plus delete any issue.';
      case 'super_admin':
        return 'Super admin: complete control including user management, role assignments, and full issue oversight.';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-page-enter">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Title & Main Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Issues</h1>
          <p className="text-xs text-gray-500 mt-1">
            Every report on campus, with its current status.
          </p>
        </div>
        <Link
          to="/report"
          className="inline-flex items-center justify-center px-4 py-2 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded shadow-none btn-interactive"
        >
          Report an issue
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total issues" value={stats.total} colorClass="text-ink" />
        <StatCard label="Open" value={stats.open} colorClass="text-statusOpen" />
        <StatCard label="In progress" value={stats.inProgress} colorClass="text-statusProgress" />
        <StatCard label="Resolved" value={stats.resolved} colorClass="text-statusResolved" />
      </div>

      {/* Search, Filters, and Tab Toggle Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-4">
        {/* Left side filters */}
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description"
            className="w-full sm:w-64 px-3 py-2 text-xs bg-white border border-line rounded focus:outline-none focus:border-teal"
          />

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-line rounded focus:outline-none focus:border-teal text-gray-700"
          >
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-line rounded focus:outline-none focus:border-teal text-gray-700"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Right side Toggle Buttons */}
        <div className="flex items-center bg-white border border-line rounded p-0.5 self-start md:self-auto">
          <button
            onClick={() => setViewTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              viewTab === 'all'
                ? 'bg-teal text-white'
                : 'text-gray-600 hover:text-ink'
            }`}
          >
            All issues
          </button>
          <button
            onClick={() => setViewTab('my')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              viewTab === 'my'
                ? 'bg-teal text-white'
                : 'text-gray-600 hover:text-ink'
            }`}
          >
            {['student', 'staff'].includes(user?.role) ? 'My reports' : 'Needs attention'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {/* Loading Skeleton */}
      {loading ? (
        <SkeletonLoader />
      ) : issues.length === 0 ? (
        <EmptyState message="No issues match your current filters or search query." />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <IssueTable
              issues={issues}
              currentUser={user}
              onStatusChange={handleStatusChange}
              onDeleteClick={(issue) => setDeleteTarget(issue)}
              newlyCreatedId={newlyCreatedId}
            />
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="md:hidden space-y-3">
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                currentUser={user}
                onStatusChange={handleStatusChange}
                onDeleteClick={(issue) => setDeleteTarget(issue)}
                isNewlyCreated={issue.id === newlyCreatedId}
              />
            ))}
          </div>
        </>
      )}

      {/* Role Behavior Caption Bar per design mockups */}
      <div className="mt-8 bg-white border border-line rounded-card p-4 flex items-center shadow-none">
        <div className="w-1 self-stretch bg-safetyYellow rounded-full mr-3.5" />
        <p className="text-xs text-gray-700 font-normal">{getRoleCaption()}</p>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ''}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

