import React from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';

export default function MemberPlaceholderPage({ title, icon = 'build', desc }) {
  return (
    <MemberLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4 max-w-2xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-[36px]">{icon}</span>
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-black uppercase tracking-wider">
              FEATURE IN DEVELOPMENT
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              {desc}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-600 font-medium">
            Khung sườn tính năng đã hoàn tất định tuyến. Bạn có thể bắt đầu lập trình giao diện & nghiệp vụ chi tiết cho module này!
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}