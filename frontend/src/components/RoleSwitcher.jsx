import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function RoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { switchRole } = useApp();

  const roles = [
    { name: '🌐 Khách / Landing', path: '/', badge: 'Public', roleKey: 'member' },
    { name: '💳 Bảng giá & Gói', path: '/pricing', badge: 'Pricing', roleKey: 'member' },
    { name: '🔐 Đăng nhập / ĐK', path: '/login', badge: 'Auth', roleKey: 'member' },
    { name: '👤 Hội viên (Member)', path: '/member', badge: 'Flow 1, 2, 6', roleKey: 'member' },
    { name: '🛎️ Lễ tân (Receptionist)', path: '/receptionist', badge: 'Flow 1, 3, 4', roleKey: 'receptionist' },
    { name: '🏋️‍♂️ HLV (Coach)', path: '/coach', badge: 'Flow 2, 4, 5', roleKey: 'coach' },
    { name: '👑 Quản lý (Admin)', path: '/admin', badge: 'Flow 1, 2, 3', roleKey: 'admin' },
  ];

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-4 lg:right-4 z-50">
      {/* Floating Toggle Pill */}
      <div className="flex items-center gap-2 bg-[#00132b]/95 text-white backdrop-blur-xl p-1.5 pl-3 rounded-full shadow-[0_8px_30px_rgba(0,19,43,0.35)] border border-slate-700">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c1f100] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c1f100]"></span>
        </span>
        <span className="text-[12px] font-bold text-slate-200">Demo Role Switcher</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#c1f100] text-slate-950 font-bold px-3 py-1 rounded-full text-[12px] hover:bg-[#abd600] transition-all flex items-center gap-1 shadow-sm cursor-pointer"
        >
          <span>{isOpen ? 'Đóng' : 'Chọn Role'}</span>
          <span className="material-symbols-outlined text-[16px]">
            {isOpen ? 'expand_more' : 'swap_horiz'}
          </span>
        </button>
      </div>

      {/* Role Picker Drawer */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="px-2 py-1 flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Chuyển nhanh phân hệ (Demo)
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
              4 Roles
            </span>
          </div>

          <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pt-1">
            {roles.map((r) => {
              const active = location.pathname === r.path || (r.path !== '/' && location.pathname.startsWith(r.path));
              return (
                <button
                  key={r.path}
                  onClick={() => {
                    if (r.roleKey) switchRole(r.roleKey);
                    navigate(r.path);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    active
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-[13px]">{r.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                      active
                        ? 'bg-secondary-container text-primary'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {r.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
