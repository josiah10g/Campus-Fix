// frontend/src/components/StatusSelect.jsx
import React, { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

export default function StatusSelect({ currentStatus, onStatusChange, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const options = ['Open', 'In Progress', 'Resolved'];

  const getStyle = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-[#FDEDEB] text-[#B93A32] border-[#F8B4B4]';
      case 'In Progress':
        return 'bg-[#FEF6E6] text-[#8A5A00] border-[#FCD34D]';
      case 'Resolved':
        return 'bg-[#EAF6F0] text-[#22724F] border-[#A7F3D0]';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleSelect = async (status) => {
    if (status === currentStatus || loading) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      await onStatusChange(status);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center justify-between gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStyle(
          currentStatus
        )} focus:outline-none focus:ring-2 focus:ring-teal transition-all duration-200 cursor-pointer disabled:opacity-50`}
      >
        <span>{currentStatus}</span>
        {loading ? (
          <Loader2 size={12} className="animate-spin text-current" />
        ) : (
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 w-32 rounded-md bg-white shadow-lg border border-line z-20 py-1 text-xs animate-page-enter">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-3 py-1.5 font-medium hover:bg-gray-50 flex items-center justify-between ${
                  opt === currentStatus ? 'font-bold text-teal' : 'text-ink'
                }`}
              >
                <span>{opt}</span>
                {opt === currentStatus && <span className="w-1.5 h-1.5 rounded-full bg-teal" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

