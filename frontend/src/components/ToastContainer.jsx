import React from 'react';
import { useApp } from '../context/AppContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto transform transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-xl ${
              isSuccess
                ? 'bg-slate-900/95 text-white border-slate-700/80 shadow-[0_8px_30px_rgba(0,19,43,0.3)]'
                : isError
                ? 'bg-red-950/95 text-white border-red-800/80 shadow-[0_8px_30px_rgba(186,26,26,0.3)]'
                : isWarning
                ? 'bg-amber-950/95 text-white border-amber-700/80 shadow-[0_8px_30px_rgba(217,119,6,0.3)]'
                : 'bg-slate-900/95 text-white border-slate-700/80'
            }`}
          >
            {/* Status Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isSuccess
                  ? 'bg-[#c1f100] text-slate-950'
                  : isError
                  ? 'bg-red-500 text-white'
                  : isWarning
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-sky-400 text-slate-950'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] font-bold">
                {isSuccess
                  ? 'check_circle'
                  : isError
                  ? 'cancel'
                  : isWarning
                  ? 'warning'
                  : 'info'}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-headline-sm text-xs font-bold tracking-wide truncate">
                  {toast.title}
                </h4>
                <span className="text-[10px] text-slate-400 shrink-0">vừa xong</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">
                {toast.message}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
