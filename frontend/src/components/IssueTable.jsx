// frontend/src/components/IssueTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import StatusPill from './StatusPill';

export default function IssueTable({
  issues,
  currentUser,
  onDeleteClick,
  newlyCreatedId,
  deletingId,
}) {
  const canDeleteAny = ['admin', 'super_admin'].includes(currentUser.role);

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-[#FAFBFB] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3.5">Title</th>
              <th scope="col" className="px-5 py-3.5">Category</th>
              <th scope="col" className="px-5 py-3.5">Reporter & Affiliation</th>
              <th scope="col" className="px-5 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {issues.map((issue, index) => {
              const isOwner = issue.reporter_id === currentUser.id;
              const isOwnerOpen = isOwner && issue.status === 'Open';
              const canEdit = isOwnerOpen || ['maintenance', 'admin', 'super_admin'].includes(currentUser.role);
              const canDelete = isOwnerOpen || canDeleteAny;
              const isNewlyCreated = issue.id === newlyCreatedId;

              const levelText = issue.reporter_level || '';
              const departmentText = issue.reporter_department || issue.reporter_faculty || '';

              return (
                <tr
                  key={issue.id}
                  className={`table-row-hover ${index < 8 ? 'animate-row-enter' : ''} ${isNewlyCreated ? 'animate-highlight-new' : ''} ${issue.id === deletingId ? 'animate-row-delete' : ''}`}
                  style={index < 8 ? { animationDelay: `${index * 40}ms` } : undefined}
                >
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-bold text-ink text-sm flex items-center gap-2">
                      {issue.title}
                      {issue.image_url && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal/10 text-teal border border-teal/20" title="Includes photo attachment">
                          📷 Photo
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{issue.location}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                    {issue.category === 'Other' && issue.category_detail
                      ? `Other: ${issue.category_detail}`
                      : issue.category}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm">
                    <div className="font-semibold text-ink">
                      {isOwner ? <span className="text-teal font-bold">You</span> : issue.reporter_name}
                    </div>
                    {levelText && (
                      <div className="text-[11px] font-medium text-teal uppercase mt-0.5">
                        {levelText}
                      </div>
                    )}
                    {departmentText && (
                      <div className="text-[11px] text-gray-500 uppercase tracking-wide truncate max-w-[220px]" title={departmentText}>
                        {departmentText}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusPill status={issue.status} />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="inline-flex min-w-16 items-center justify-center rounded border border-teal/30 bg-white px-2.5 py-1.5 text-xs font-semibold text-teal hover:bg-teal hover:text-white btn-interactive"
                      >
                        View
                      </Link>

                      {canEdit && (
                        <Link
                          to={`/issues/${issue.id}/edit`}
                          className="inline-flex min-w-16 items-center justify-center rounded border border-teal/30 bg-white px-2.5 py-1.5 text-xs font-semibold text-teal hover:bg-teal hover:text-white btn-interactive"
                        >
                          Edit
                        </Link>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => onDeleteClick(issue)}
                          className="inline-flex min-w-16 items-center justify-center rounded border border-statusOpen/30 bg-white px-2.5 py-1.5 text-xs font-semibold text-statusOpen hover:bg-statusOpen hover:text-white btn-interactive"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
