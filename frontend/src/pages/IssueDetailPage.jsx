// frontend/src/pages/IssueDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import StatusPill from '../components/StatusPill';
import StatusSelect from '../components/StatusSelect';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Toast from '../components/Toast';
import { ArrowLeft, Loader2, Calendar, MapPin, Tag, User } from 'lucide-react';

export default function IssueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const data = await api.getIssue(id);
        setIssue(data);
      } catch (err) {
        setToast({ type: 'error', message: err.message || 'Issue not found.' });
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await api.updateIssue(id, { status: newStatus });
      setIssue(updated);
      setToast({ type: 'success', message: `Status updated to ${newStatus}.` });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Could not update status.' });
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
  const canEdit = isOwnerOpen || ['maintenance', 'admin', 'super_admin'].includes(user.role);
  const canDelete = isOwnerOpen || ['admin', 'super_admin'].includes(user.role);
  const canChangeStatusInline = ['maintenance', 'admin', 'super_admin'].includes(user.role);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-page-enter">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mb-4">
        <Link
          to="/issues"
          className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back to all issues
        </Link>
      </div>

      <div className="bg-white border border-line rounded-card p-6 sm:p-8">
        {/* Header with Title and Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-line">
          <div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
              <span>Issue #{issue.id}</span>
              <span>•</span>
              <span className="flex items-center">
                <Calendar size={12} className="mr-1" />
                {new Date(issue.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-xl font-bold text-ink">{issue.title}</h1>
          </div>

          <div>
            {canChangeStatusInline ? (
              <StatusSelect
                currentStatus={issue.status}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <StatusPill status={issue.status} />
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-line text-xs">
          <div className="flex items-center text-gray-600">
            <Tag size={14} className="mr-2 text-gray-400" />
            <div>
              <span className="text-gray-400 block">Category</span>
              <span className="font-semibold text-ink">{issue.category}</span>
            </div>
          </div>

          <div className="flex items-center text-gray-600">
            <MapPin size={14} className="mr-2 text-gray-400" />
            <div>
              <span className="text-gray-400 block">Location</span>
              <span className="font-semibold text-ink">{issue.location}</span>
            </div>
          </div>

          <div className="flex items-center text-gray-600">
            <User size={14} className="mr-2 text-gray-400" />
            <div>
              <span className="text-gray-400 block">Reporter</span>
              <span className="font-semibold text-ink">
                {isOwner ? 'You' : issue.reporter_name}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="py-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Description
          </h2>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {issue.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-line flex justify-between items-center">
          <div className="space-x-3">
            {canEdit && (
              <Link
                to={`/issues/${issue.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-line text-xs font-semibold rounded text-ink bg-white hover:bg-gray-50 focus:outline-none"
              >
                Edit issue
              </Link>
            )}
          </div>

          {canDelete && (
            <button
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded text-white bg-statusOpen hover:bg-[#A32F28] focus:outline-none"
            >
              Delete issue
            </button>
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
