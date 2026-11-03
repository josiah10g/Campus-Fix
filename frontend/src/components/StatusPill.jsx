// frontend/src/components/StatusPill.jsx
import React from 'react';

export default function StatusPill({ status }) {
  let styleClasses = 'bg-gray-100 text-gray-700';

  if (status === 'Open') {
    styleClasses = 'bg-statusOpen-bg text-statusOpen';
  } else if (status === 'In Progress') {
    styleClasses = 'bg-statusProgress-bg text-statusProgress';
  } else if (status === 'Resolved') {
    styleClasses = 'bg-statusResolved-bg text-statusResolved';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styleClasses} transition-colors duration-200`}
    >
      {status}
    </span>
  );
}

