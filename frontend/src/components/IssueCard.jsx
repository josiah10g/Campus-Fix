// frontend/src/components/IssueCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import StatusPill from './StatusPill';

export default function IssueCard({
  issue,
  currentUser,
  onDeleteClick,
  isNewlyCreated,
  index = 0,
  isDeleting = false,
}) {
  const canDeleteAny = ['admin', 'super_admin'].includes(currentUser.role);

  const isOwner = issue.reporter_id === currentUser.id;
  const isOwnerOpen = isOwner && issue.status === 'Open';
  const canEdit = isOwnerOpen || ['maintenance', 'admin', 'super_admin'].includes(currentUser.role);
  const canDelete = isOwnerOpen || canDeleteAny;

  const levelText = issue.reporter_level || '';
  const departmentText = issue.reporter_department || issue.reporter_faculty || '';

  return (
    <div
      style={index < 8 ? { animationDelay: `${index * 40}ms` } : undefined}
      className={`bg-white border border-line rounded-card p-4 card-interactive ${index < 8 ? 'animate-row-enter' : ''} ${isDeleting ? 'animate-row-delete' : ''} ${
        isNewlyCreated ? 'animate-highlight-new' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-ink text-base flex items-center gap-2">
            {issue.title}
            {issue.image_url && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal/10 text-teal border border-teal/20">
                📷 Photo
              </span>
            )}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">{issue.location}</p>
        </div>
        <div>
          <StatusPill status={issue.status} />
        </div>
      </div>

      <p className="text-sm text-gray-700 line-clamp-2 mb-3">{issue.description}</p>

      {/* Reporter info with academic affiliation stacked */}
      <div className="mb-3 px-3 py-2 bg-[#FAFBFB] rounded border border-line flex items-center justify-between text-xs">
        <span className="text-gray-500 font-medium">Reported by:</span>
        <div className="text-right">
          <span className="font-semibold text-ink">
            {isOwner ? <span className="text-teal font-bold">You</span> : issue.reporter_name}
          </span>
          {levelText && (
            <div className="text-[11px] font-medium text-teal uppercase mt-0.5">
              {levelText}
            </div>
          )}
          {departmentText && (
            <div className="text-[11px] text-gray-500 uppercase tracking-wide truncate max-w-[200px]" title={departmentText}>
              {departmentText}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-line text-xs">
        <div className="flex items-center space-x-2 text-gray-600">
          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">
            {issue.category === 'Other' && issue.category_detail
              ? `Other: ${issue.category_detail}`
              : issue.category}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 font-semibold">
          <Link to={`/issues/${issue.id}`} className="inline-flex min-w-16 items-center justify-center rounded border border-teal/30 bg-white px-2.5 py-1.5 text-xs text-teal hover:bg-teal hover:text-white btn-interactive">
            View
          </Link>
          {canEdit && (
            <Link to={`/issues/${issue.id}/edit`} className="inline-flex min-w-16 items-center justify-center rounded border border-teal/30 bg-white px-2.5 py-1.5 text-xs text-teal hover:bg-teal hover:text-white btn-interactive">
              Edit
            </Link>
          )}
          {canDelete && (
            <button
              onClick={() => onDeleteClick(issue)}
              className="inline-flex min-w-16 items-center justify-center rounded border border-statusOpen/30 bg-white px-2.5 py-1.5 text-xs text-statusOpen hover:bg-statusOpen hover:text-white btn-interactive"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
