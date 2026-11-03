// frontend/src/components/IssueCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import StatusPill from './StatusPill';
import StatusSelect from './StatusSelect';

export default function IssueCard({
  issue,
  currentUser,
  onStatusChange,
  onDeleteClick,
  isNewlyCreated,
  index = 0,
}) {
  const canChangeStatusInline = ['maintenance', 'admin', 'super_admin'].includes(currentUser.role);
  const canDeleteAny = ['admin', 'super_admin'].includes(currentUser.role);

  const isOwner = issue.reporter_id === currentUser.id;
  const isOwnerOpen = isOwner && issue.status === 'Open';
  const canEdit = isOwnerOpen || ['maintenance', 'admin', 'super_admin'].includes(currentUser.role);
  const canDelete = isOwnerOpen || canDeleteAny;

  return (
    <div
      style={index < 8 ? { animationDelay: `${index * 40}ms` } : undefined}
      className={`bg-white border border-line rounded-card p-4 card-interactive ${index < 8 ? 'animate-row-enter' : ''} ${
        isNewlyCreated ? 'animate-highlight-new' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-ink text-base">{issue.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{issue.location}</p>
        </div>
        <div>
          {canChangeStatusInline ? (
            <StatusSelect
              currentStatus={issue.status}
              onStatusChange={(newStatus) => onStatusChange(issue.id, newStatus)}
            />
          ) : (
            <StatusPill status={issue.status} />
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 line-clamp-2 mb-3">{issue.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-line text-xs">
        <div className="flex items-center space-x-2 text-gray-600">
          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">
            {issue.category}
          </span>
          <span>•</span>
          <span>
            {isOwner ? (
              <strong className="text-teal font-semibold">You</strong>
            ) : (
              issue.reporter_name
            )}
          </span>
        </div>

        <div className="flex items-center space-x-3 font-semibold">
          <Link to={`/issues/${issue.id}`} className="text-teal hover:underline">
            View
          </Link>
          {canEdit && (
            <Link to={`/issues/${issue.id}/edit`} className="text-teal hover:underline">
              Edit
            </Link>
          )}
          {canDelete && (
            <button
              onClick={() => onDeleteClick(issue)}
              className="text-statusOpen hover:underline focus:outline-none"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

