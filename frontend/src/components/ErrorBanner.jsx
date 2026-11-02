// frontend/src/components/ErrorBanner.jsx
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 flex items-start justify-between">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-statusOpen mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-statusOpen">Connection or Server Error</h4>
          <p className="text-sm text-gray-700 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-statusOpen bg-red-100 hover:bg-red-200 focus:outline-none"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Try again
        </button>
      )}
    </div>
  );
}
