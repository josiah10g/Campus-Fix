// frontend/src/components/SkeletonLoader.jsx
import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-card" />
        ))}
      </div>

      {/* Filter bar Skeleton */}
      <div className="h-10 bg-gray-200 rounded mb-4" />

      {/* Table rows Skeleton */}
      <div className="bg-white border border-line rounded-card overflow-hidden p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
            <div className="space-y-2 w-1/3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/6 hidden sm:block" />
            <div className="h-4 bg-gray-200 rounded w-1/6 hidden sm:block" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
