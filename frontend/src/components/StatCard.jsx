// frontend/src/components/StatCard.jsx
import React, { useEffect, useRef, useState } from 'react';

export default function StatCard({ label, value, colorClass = 'text-ink' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  // Smooth count-up effect on initial load (approx 600ms)
  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    if (hasAnimated.current) {
      setDisplayValue(end);
      return;
    }
    hasAnimated.current = true;

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
    <div className="bg-white border border-line rounded-card p-4 card-interactive">
      <div className="mb-1 text-base font-bold leading-tight text-ink">{label}</div>
      <div className={`text-3xl font-extrabold tracking-tight ${colorClass}`}>
        {displayValue}
      </div>
    </div>
  );
}

