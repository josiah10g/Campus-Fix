// frontend/src/pages/IssueDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import StatusPill from '../components/StatusPill';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Toast from '../components/Toast';
import { ChevronLeft, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved'];

export default function IssueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Open');
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [toast, setToast] = useState(null);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const data = await api.getIssue(id);
        setIssue(data);
        setSelectedStatus(data.status);
      } catch (err) {
        setToast({ type: 'error', message: err.message || 'Issue not found.' });
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [id]);

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    try {
      const updated = await api.updateIssue(id, { status: selectedStatus });
      setIssue(updated);
      setToast({ type: 'success', message: 'Status updated successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Could not update status.' });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.deleteIssue(id);
      navigate('/issues', {
        state: { message: 'Issue deleted successfully.' },
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete issue.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white border border-line rounded-card text-center">
        <h3 className="text-base font-bold text-ink">Issue not found</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">This issue may have been removed.</p>
        <Link to="/issues" className="text-xs font-semibold text-teal hover:underline">
          Return to issues list
        </Link>
      </div>
    );
  }

  const isOwner = issue.reporter_id === user.id;
  const isOwnerOpen = isOwner && issue.status === 'Open';
  const canEditDetails = isOwnerOpen || ['maintenance', 'admin', 'super_admin'].includes(user.role);
  const canChangeStatus = ['maintenance', 'admin', 'super_admin'].includes(user.role);
  const canDelete = isOwnerOpen || ['admin', 'super_admin'].includes(user.role);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-page-enter">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Back button */}
      <div className="mb-4">
        <Link
          to="/issues"
          className="inline-flex items-center text-xs font-semibold text-gray-600 hover:text-ink transition-colors"
        >
          <ChevronLeft size={15} className="mr-0.5" />
          All issues
        </Link>
      </div>

      {/* Main 2-column Detail Layout matching Image 08 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Issue details card */}
        <div className="lg:col-span-8 bg-white border border-line rounded-card p-6 sm:p-8">
          <div className="flex items-center justify-between pb-6 border-b border-line">
            <h1 className="text-2xl font-bold text-ink">{issue.title}</h1>
            <StatusPill status={issue.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-line text-xs">
            <div>
              <span className="text-gray-400 block mb-1">Category</span>
              <span className="font-semibold text-ink">{issue.category}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Location</span>
              <span className="font-semibold text-ink">{issue.location}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Reported by</span>
              <span className="font-semibold text-ink">
                {isOwner ? 'You' : issue.reporter_name}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Reported on</span>
              <span className="font-semibold text-ink">
                {new Date(issue.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="pt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Description
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {issue.description}
            </p>
          </div>
        </div>

        {/* Right Column: Actions Card */}
        <div className="lg:col-span-4 bg-white border border-line rounded-card p-6">
          <h2 className="text-base font-bold text-ink mb-4">Actions</h2>

          {/* Status update box (maintenance, admin, super_admin) */}
          {canChangeStatus ? (
            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold text-ink">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-line rounded bg-white text-ink focus:outline-none focus:border-teal font-medium"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={savingStatus}
                className="w-full py-2.5 px-4 bg-teal hover:bg-teal-dark text-white text-xs font-semibold rounded shadow-none btn-interactive flex items-center justify-center disabled:opacity-50"
              >
                {savingStatus && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                Save status
              </button>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-gray-50 border border-line rounded text-xs text-gray-500">
              Status is managed by campus maintenance staff.
            </div>
          )}

          {/* Edit details action button */}
          {canEditDetails && (
            <div className="mb-4">
              <Link
                to={`/issues/${issue.id}/edit`}
                className="w-full py-2 px-4 border border-line text-ink hover:bg-gray-50 text-xs font-semibold rounded text-center block transition-colors"
              >
                Edit details
              </Link>
            </div>
          )}

          {/* Delete issue action or notice */}
          {canDelete ? (
            <div className="pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="w-full py-2 px-4 border border-line text-statusOpen hover:bg-red-50 text-xs font-semibold rounded transition-colors"
              >
                Delete issue
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-line text-xs text-gray-400">
              <div className="font-medium text-gray-500">Delete issue</div>
              <p className="mt-0.5">Only admin and super admin can delete.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteOpen}
        title={issue.title}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
