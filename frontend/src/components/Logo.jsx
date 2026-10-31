import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ className = '', showText = true, isDark = false }) {
  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      {/* Icon Logo chữ F thể thao màu Cam Gradient FPT */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 p-2 shadow-md shadow-orange-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full text-white drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Biểu tượng Chữ F nghiêng cách điệu thể thao */}
          <path
            d="M7 4H19L17.5 8H11.5L10.5 11H16.5L15 15H10L8.5 20H4.5L7 4Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Tên thương hiệu F SPORT CENTER */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-headline-sm text-[18px] uppercase tracking-tight flex items-center gap-1 font-black ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            F SPORT <span className="text-orange-500">CENTER</span>
          </span>
          <span className={`text-[10px] uppercase tracking-widest font-bold ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Trung Tâm Thể Thao Đa Năng
          </span>
        </div>
      )}
    </Link>
  );
}