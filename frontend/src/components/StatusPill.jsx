// frontend/src/components/StatusPill.jsx
import React from 'react';

export default function StatusPill({ status }) {
  let styleClasses = 'bg-gray-100 text-gray-700';

  if (status === 'Open') {
    styleClasses = 'bg-[#FDEDEB] text-[#B93A32]';
  } else if (status === 'In Progress') {
    styleClasses = 'bg-[#FEF6E6] text-[#8A5A00]';
  } else if (status === 'Resolved') {
    styleClasses = 'bg-[#EAF6F0] text-[#22724F]';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styleClasses} transition-colors duration-200`}
    >
      {status}
    </span>
  );
}
