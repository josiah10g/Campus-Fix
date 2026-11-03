// frontend/src/components/ConfirmDeleteModal.jsx
import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  title,
  location = '',
  onConfirm,
  onCancel,
  loading = false,
}) {
  const [visible, setVisible] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const close = () => {
    if (!loading) {
      setClosing(true);
      onCancel();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 ${closing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
        onClick={close}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className={`relative transform overflow-hidden rounded-card bg-white text-left shadow-xl w-full max-w-md p-6 border border-line ${closing ? 'animate-modal-out' : 'animate-modal-in'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start">
            <div className="mx-auto flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <AlertCircle className="h-5 w-5 text-statusOpen" />
            </div>
            <div className="mt-0.5 ml-4 text-left">
              <h3 className="text-base font-bold text-ink">Delete this issue?</h3>
              <p className="mt-1 text-sm text-gray-600">
                <span className="font-semibold text-ink">{title}</span>
                {location ? ` in ${location}` : ''} will be removed for everyone.
              </p>
              <p className="text-xs text-gray-500 mt-1">This cannot be undone.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-[11px] text-gray-400">
              Owner while Open, or admin and above
            </span>
            <div className="flex space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-ink bg-white border border-line rounded hover:bg-gray-50 focus:outline-none disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-statusOpen rounded hover:bg-[#A32F28] focus:outline-none disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Delete issue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
