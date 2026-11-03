// frontend/src/components/StatusPill.jsx
import React from 'react';

export default function StatusPill({ status, label = status }) {
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
      className={`inline-flex h-7 w-28 shrink-0 items-center justify-center whitespace-nowrap rounded-full text-xs font-semibold ${styleClasses} transition-colors duration-200`}
    >
      {label}
    </span>
  );
}

