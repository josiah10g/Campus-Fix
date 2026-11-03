// frontend/src/pages/IssuesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
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
  const [viewTab, setViewTab] = useState('all'); // 'all' or 'my'

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // One-time Welcome Banner state (keyed by user ID in localStorage)
  const [welcomeVisible, setWelcomeVisible] = useState(() => {
    if (!user) return false;
    const dismissed = localStorage.getItem(`welcome_dismissed_${user.id}`);
    if (dismissed) return false;
    return Boolean(location.state?.welcome);
  });

  const dismissWelcome = () => {
    setWelcomeVisible(false);
    if (user?.id) {
      localStorage.setItem(`welcome_dismissed_${user.id}`, 'true');
    }
  };

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

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.deleteIssue(deleteTarget.id);
      setDeletingId(deleteTarget.id);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setIssues((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeletingId(null);
      const newStats = await api.getStats();
      setStats(newStats);
      setToast({ type: 'success', message: 'Issue deleted successfully.' });
      setDeleteTarget(null);
    } catch (err) {
      setDeletingId(null);
      setToast({ type: 'error', message: err.message || 'Failed to delete issue.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const isMyReportsEmpty = viewTab === 'my' && issues.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-page-enter">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* One-time Welcome Banner matching Image 11 */}
      {welcomeVisible && (
        <section className="mb-6 rounded-card border border-amber-200 border-l-4 border-l-safetyYellow bg-[#FEF9EE] p-6 shadow-sm animate-page-enter" role="status">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-ink">
                Welcome to CampusFix, {user?.name?.split(' ')[0] || user?.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Your account is ready. Spotted something broken? Report it and follow its progress right here.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  to="/report"
                  className="px-4 py-2 bg-teal hover:bg-teal-dark text-white text-xs font-semibold rounded shadow-none btn-interactive"
                >
                  Report my first issue
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setViewTab('all');
                  }}
                  className="px-4 py-2 bg-white border border-line text-ink hover:bg-gray-50 text-xs font-semibold rounded shadow-none btn-interactive"
                >
                  Browse all issues
                </button>
              </div>
            </div>
            <button
              onClick={dismissWelcome}
              className="text-xs font-semibold text-gray-500 hover:text-ink self-start sm:self-auto cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* Page Title & Main Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {viewTab === 'my' ? 'My reports' : 'Issues'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {viewTab === 'my'
              ? 'Issues you have submitted to campus maintenance.'
              : 'Every report on campus, with its current status.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/profile" className="inline-flex items-center justify-center gap-2 rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-teal hover:text-teal btn-interactive">
            <Settings size={16} /> Profile settings
          </Link>
          <Link
            to="/report"
            className="inline-flex items-center justify-center px-4 py-2 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded shadow-none btn-interactive"
          >
            Report an issue
          </Link>
        </div>
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
        <EmptyState
          isMyReports={isMyReportsEmpty}
          onBrowseIssues={() => setViewTab('all')}
          message="No issues match your current filters or search query."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <IssueTable
              issues={issues}
              currentUser={user}
              onDeleteClick={(issue) => setDeleteTarget(issue)}
              newlyCreatedId={newlyCreatedId}
              deletingId={deletingId}
            />
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="md:hidden space-y-3">
            {issues.map((issue, index) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                currentUser={user}
                onDeleteClick={(issue) => setDeleteTarget(issue)}
                isNewlyCreated={issue.id === newlyCreatedId}
                index={index}
                isDeleting={issue.id === deletingId}
              />
            ))}
          </div>

          {/* Mobile full-width report button matching Image 09 */}
          <div className="md:hidden mt-4">
            <Link
              to="/report"
              className="w-full block text-center py-3 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded shadow-none btn-interactive"
            >
              Report an issue
            </Link>
          </div>
        </>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ''}
        location={deleteTarget?.location || ''}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
