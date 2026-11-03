// frontend/src/components/Toast.jsx
import React, { useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    // Success toasts auto dismiss after 3 seconds; errors stay until dismissed
    if (toast?.type !== 'error' && toast) {
      const timer = setTimeout(() => {
        closeRef.current?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  const { type = 'success', message } = toast;
  const isSuccess = type === 'success';

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm animate-toast-in">
      <div
        className={`flex items-start p-3.5 rounded shadow-md ${
          isSuccess
            ? 'bg-white border-l-4 border-l-safetyYellow border-y border-r border-y-emerald-200 border-r-emerald-200'
            : 'bg-[#FFF5F5] border border-rose-200'
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
