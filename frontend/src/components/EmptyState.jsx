// frontend/src/components/EmptyState.jsx
import React from 'react';
import { ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ message = 'Report the first one.', canReport = true }) {
  return (
    <div className="text-center py-12 px-4 bg-white border border-line rounded-card">
      <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-bold text-ink">No issues yet</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      {canReport && (
        <div className="mt-6">
          <Link
            to="/report"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded shadow-none text-white bg-teal hover:bg-teal-dark focus:outline-none"
          >
            Report an issue
          </Link>
        </div>
      )}
    </div>
  );
}

