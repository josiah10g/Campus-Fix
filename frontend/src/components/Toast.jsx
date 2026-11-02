// frontend/src/components/Toast.jsx
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { type = 'success', message } = toast;
  const isSuccess = type === 'success';

  useEffect(() => {
    // Success toasts auto dismiss after 3 seconds; errors stay until dismissed
    if (isSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-toast-in">
      <div
        className={`flex items-start p-3.5 rounded border shadow-md bg-white ${
          isSuccess ? 'border-emerald-200' : 'border-rose-200'
        }`}
      >
        <div className="flex-shrink-0 mt-0.5">
          {isSuccess ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-statusOpen" />
          )}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-ink">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-ink focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
