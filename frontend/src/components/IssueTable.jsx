// frontend/src/components/IssueTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import StatusPill from './StatusPill';
import StatusSelect from './StatusSelect';

export default function IssueTable({
  issues,
  currentUser,
  onStatusChange,
  onDeleteClick,
  newlyCreatedId,
}) {
  const canChangeStatusInline = ['maintenance', 'admin', 'super_admin'].includes(currentUser.role);
  const canDeleteAny = ['admin', 'super_admin'].includes(currentUser.role);

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead className="bg-[#FAFBFB] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3.5">Title</th>
              <th scope="col" className="px-5 py-3.5">Category</th>
              <th scope="col" className="px-5 py-3.5">Reporter</th>
              <th scope="col" className="px-5 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {issues.map((issue) => {
              const isOwner = issue.reporter_id === currentUser.id;
              const isOwnerOpen = isOwner && issue.status === 'Open';
              const canEdit = isOwnerOpen || ['maintenance', 'admin', 'super_admin'].includes(currentUser.role);
              const canDelete = isOwnerOpen || canDeleteAny;
              const isNewlyCreated = issue.id === newlyCreatedId;

              return (
                <tr
                  key={issue.id}
                  className={`table-row-hover ${isNewlyCreated ? 'animate-highlight-new' : ''}`}
                >
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-bold text-ink text-sm">{issue.title}</div>
                    <div className="text-xs text-gray-500">{issue.location}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                    {issue.category}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm">
                    {isOwner ? (
                      <span className="font-semibold text-teal">You</span>
                    ) : (
                      <span className="text-gray-700">{issue.reporter_name}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {canChangeStatusInline ? (
                      <StatusSelect
                        currentStatus={issue.status}
                        onStatusChange={(newStatus) => onStatusChange(issue.id, newStatus)}
                      />
                    ) : (
                      <StatusPill status={issue.status} />
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right space-x-3 text-xs font-semibold">
                    <Link
                      to={`/issues/${issue.id}`}
                      className="text-teal hover:underline"
                    >
                      View
                    </Link>

                    {canEdit && (
                      <Link
                        to={`/issues/${issue.id}/edit`}
                        className="text-teal hover:underline"
                      >
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
