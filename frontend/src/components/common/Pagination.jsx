import React from 'react';

/**
 * Reusable Pagination Component with <- ******** -> style
 * @param {number} currentPage - 1-based current page
 * @param {number} totalPages - total number of pages
 * @param {function} onPageChange - callback when page changes
 * @param {string} [className] - extra styles
 */
export default function Pagination({ currentPage, totalPages, onPageChange, className = '' }) {
  if (!totalPages || totalPages <= 1) return null;

  // Generate page numbers or ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      aria-label="Phân trang"
      className={`flex items-center justify-between gap-3 text-xs font-semibold ${className}`}
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
        aria-label="Trang trước"
      >
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        <span className="text-[11px] font-bold">Trước</span>
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold select-none text-xs">
                ...
              </span>
            );
          }
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                isActive
                  ? 'bg-orange-500 text-white shadow-xs scale-105'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
        aria-label="Trang sau"
      >
        <span className="text-[11px] font-bold">Sau</span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </nav>
  );
}
