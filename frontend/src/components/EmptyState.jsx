// frontend/src/components/EmptyState.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  isMyReports = false,
  message = 'Report the first one.',
  onBrowseIssues,
}) {
  if (isMyReports) {
    return (
      <div className="text-center py-16 px-4 bg-white border border-line rounded-card animate-page-enter">
        <h3 className="text-base font-bold text-ink">You have not reported anything yet</h3>
        <p className="mt-1 text-xs text-gray-500">Your reports will show up here with their current status.</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            to="/report"
            className="px-5 py-2.5 bg-teal hover:bg-teal-dark text-white text-xs font-semibold rounded shadow-none btn-interactive"
          >
            Report an issue
          </Link>
          <button
            type="button"
            onClick={onBrowseIssues}
            className="px-5 py-2.5 bg-white border border-line text-ink hover:bg-gray-50 text-xs font-semibold rounded shadow-none btn-interactive"
          >
            Browse issues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12 px-4 bg-white border border-line rounded-card animate-page-enter">
      <h3 className="text-sm font-bold text-ink">No issues yet</h3>
      <p className="mt-1 text-xs text-gray-500">{message}</p>
      <div className="mt-5">
        <Link
          to="/report"
          className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded shadow-none text-white bg-teal hover:bg-teal-dark focus:outline-none"
        >
          Report an issue
        </Link>
      </div>
    </div>
  );
}
