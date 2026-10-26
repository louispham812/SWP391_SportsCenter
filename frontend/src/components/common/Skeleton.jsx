import React from 'react';

export function StatCardSkeleton({ count = 4, className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded-md skeleton-shimmer" />
            <div className="h-9 w-9 rounded-xl skeleton-shimmer" />
          </div>
          <div className="h-8 w-32 rounded-lg skeleton-shimmer" />
          <div className="h-3 w-40 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5, className = "" }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            {Array.from({ length: cols }).map((_, idx) => (
              <th key={idx} className="px-5 py-3">
                <div className="h-3.5 w-16 rounded skeleton-shimmer" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/50">
              {Array.from({ length: cols }).map((_, cIdx) => (
                <td key={cIdx} className="px-5 py-3.5">
                  <div
                    className={`h-4 rounded skeleton-shimmer ${
                      cIdx === 0 ? 'w-24' : cIdx === 1 ? 'w-36' : 'w-20'
                    }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  cols = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  className = ""
}) {
  return (
    <div className={`${cols} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
          <div className="h-36 w-full rounded-xl skeleton-shimmer" />
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
            <div className="h-3 w-1/2 rounded skeleton-shimmer" />
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="h-5 w-20 rounded skeleton-shimmer" />
            <div className="h-8 w-24 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScheduleSkeleton({ rows = 5, cols = 7, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="h-6 w-40 rounded skeleton-shimmer" />
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded-lg skeleton-shimmer" />
          <div className="h-8 w-20 rounded-lg skeleton-shimmer" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl skeleton-shimmer" />
        ))}
      </div>
      <div className="space-y-2.5 pt-2">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="grid grid-cols-7 gap-2">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div key={cIdx} className="h-16 rounded-xl skeleton-shimmer opacity-75" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default {
  StatCardSkeleton,
  TableSkeleton,
  CardGridSkeleton,
  ScheduleSkeleton,
};
