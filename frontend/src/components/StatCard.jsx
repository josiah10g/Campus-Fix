// frontend/src/components/StatCard.jsx
import React, { useEffect, useState } from 'react';

export default function StatCard({ label, value, colorClass = 'text-ink' }) {
  const [displayValue, setDisplayValue] = useState(0);

  // Smooth count-up effect on initial load (approx 600ms)
  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 600;
    const stepTime = Math.abs(Math.floor(duration / end));
    const timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
      }
    }, Math.max(stepTime, 20));

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="bg-white border border-line rounded-card p-4 transition-transform duration-150 hover:-translate-y-0.5">
      <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
      <div className={`text-2xl font-bold tracking-tight ${colorClass}`}>
        {displayValue}
      </div>
    </div>
  );
}

