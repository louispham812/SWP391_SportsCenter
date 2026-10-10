import React, { useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { useApp } from '../../context/AppContext';

export default function ReceptionCheckInPage() {
  const {
    checkIns,
    checkInMember,
    members,
    classes,
    bookClass,
    cancelClass,
    addMember,
    addAuditLog,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCheckInAlert, setActiveCheckInAlert] = useState(null);

  // Modals state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showClassAssistModal, setShowClassAssistModal] = useState(false);
  const [renewTarget, setRenewTarget] = useState(null);

  // New member form
  const [newMemForm, setNewMemForm] = useState({
    name: '',
    phone: '',
    email: '',
    tier: 'Silver',
  });

  // Class assist state
  const [selectedAssistMember, setSelectedAssistMember] = useState(members[0]?.id || '');
  const [selectedAssistClass, setSelectedAssistClass] = useState(classes[0]?.id || '');

  // Support requests log
  const [supportRequests, setSupportRequests] = useState([
    {
      id: 'req_01',
      member: 'Nguyễn Minh Anh',
      phone: '0987 654 321',
      type: 'Quên vòng tay tủ đồ',
      note: 'Hội viên để quên thẻ từ trong tủ #42, lễ tân đã mở khóa dự phòng xác minh.',
      status: 'resolved',
      time: '08:15 AM',
    },
    {
      id: 'req_02',
      member: 'Đặng Tuấn Tú',
      phone: '0912 345 678',
      type: 'Yêu cầu bảo lưu thẻ',
      note: 'Đề nghị bảo lưu thẻ 14 ngày do chuyến công tác TP.HCM từ 25/11.',
      status: 'pending',
      time: '08:30 AM',
    },
  ]);

  const [newRequestNote, setNewRequestNote] = useState('');
  const [newRequestMember, setNewRequestMember] = useState('Nguyễn Minh Anh');
  const [newRequestType, setNewRequestType] = useState('Hỗ trợ kỹ thuật / thiết bị');

  const handleManualCheckIn = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const newLog = checkInMember(searchTerm);
    setActiveCheckInAlert(newLog);
    setSearchTerm('');
    setTimeout(() => setActiveCheckInAlert(null), 3500);
  };

  const handleCreateNewMember = (e) => {
    e.preventDefault();
    if (!newMemForm.name || !newMemForm.phone) return;

    addMember(newMemForm);
    setShowAddMemberModal(false);
    setNewMemForm({ name: '', phone: '', email: '', tier: 'Silver' });
  };

  const handleClassBookingAssist = (action) => {
    const mem = members.find((m) => m.id === selectedAssistMember) || members[0];
    const cls = classes.find((c) => c.id === selectedAssistClass) || classes[0];

    if (action === 'book') {
      bookClass(cls.id);
      addAuditLog('Lễ tân hỗ trợ đặt lớp', `Lễ tân đã đặt chỗ lớp "${cls.title}" cho hội viên ${mem.name}`);
    } else {
      cancelClass(cls.id);
      addAuditLog('Lễ tân hỗ trợ hủy lớp', `Lễ tân đã hủy chỗ lớp "${cls.title}" cho hội viên ${mem.name}`);
    }
    setShowClassAssistModal(false);
  };

  const handleRenewMember = (e) => {
    e.preventDefault();
    if (!renewTarget) return;

    addAuditLog('Gia hạn thẻ tại quầy', `Lễ tân đã gia hạn thành công thẻ của hội viên: ${renewTarget.name}`);
    showToast('Gia hạn thành công', `Đã gia hạn thẻ của ${renewTarget.name} thêm 12 tháng!`, 'success');
    setRenewTarget(null);
  };

  const handleAddSupportRequest = (e) => {
    e.preventDefault();
    if (!newRequestNote.trim()) return;

    const createdReq = {
      id: `req_${Date.now()}`,
      member: newRequestMember,
      phone: '098x xxx xxx',
      type: newRequestType,
      note: newRequestNote,
      status: 'pending',
      time: 'Vừa xong',
    };

    setSupportRequests([createdReq, ...supportRequests]);
    addAuditLog('Ghi nhận yêu cầu hỗ trợ', `Lễ tân tiếp nhận yêu cầu "${newRequestType}" từ ${newRequestMember}`);
    setNewRequestNote('');
    showToast('Đã ghi nhận yêu cầu', `Yêu cầu hỗ trợ của ${newRequestMember} đã được chuyển cho bộ phận vận hành!`, 'info');
  };

  return (
    <ReceptionistLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                FLOW 1, 2 & FLOW 4: RECEPTION, CHECK-IN & SUPPORT
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-slate-900">
              Quầy Tiếp Đón & Check-in Hội Viên
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Điểm danh hội viên, cấp phát tủ locker, gia hạn thẻ và hỗ trợ đặt/hủy lớp học tại quầy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowClassAssistModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">event_available</span>
              <span>Hỗ Trợ Đặt / Hủy Lớp</span>
            </button>

            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary-container text-primary font-bold text-xs uppercase tracking-wider hover:bg-secondary-fixed-dim transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Đăng Ký Hội Viên Mới</span>
            </button>
          </div>
        </div>

        {/* Check-in Notification Banner */}
        {activeCheckInAlert && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between animate-in fade-in duration-300 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-[26px]">
                check_circle
              </span>
              <div>
                <strong className="text-sm font-bold">
                  Check-in Thành Công: {activeCheckInAlert.name} ({activeCheckInAlert.memberId})
                </strong>
                <div className="text-xs text-emerald-700">
                  Đã tự động gán và mở tủ đồ thông minh <strong>{activeCheckInAlert.locker}</strong>.
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
              Thẻ Hợp Lệ
            </span>
          </div>
        )}

        {/* Search & Fast Check-In Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleManualCheckIn} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[22px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập Số điện thoại, Mã thẻ hội viên #ELT hoặc Tên..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#c3f400] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-[#abd600] transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              <span>Xác Nhận Check-In & Cấp Tủ</span>
            </button>
          </form>
        </div>

        {/* Live Queue Cards List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
              Nhật Ký Check-in Gần Nhất (Live Stream)
            </h2>
            <span className="text-xs text-slate-500">Tự động cập nhật tức thì</span>
          </div>

          <div className="space-y-3">
            {checkIns.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  item.status === 'expired'
                    ? 'bg-red-50/60 border-red-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                      item.status === 'expired'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {item.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-base font-bold text-slate-900">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">#{item.memberId}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-700">
                        {item.tier}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mt-1">{item.plan}</div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{item.time}</span>
                      <span>•</span>
                      <span>{item.method}</span>
                      <span>•</span>
                      <span className="text-slate-900 font-bold">
                        Tủ đồ: {item.locker}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {item.status === 'expired' ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                        Thẻ Hết Hạn
                      </span>
                      <button
                        onClick={() => setRenewTarget(item)}
                        className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Gia Hạn Ngay
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">
                        check_circle
                      </span>
                      <span>Hợp Lệ</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sổ Tiếp Nhận Yêu Cầu Hỗ Trợ Từ Thành Viên */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
                Tiếp Nhận & Ghi Nhận Yêu Cầu Hỗ Trợ (Member Support Log)
              </h2>
              <p className="text-xs text-slate-500">
                Lưu lại các phản hồi, sự cố tủ đồ, yêu cầu bảo lưu thẻ hoặc đổi ca tập của hội viên
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {supportRequests.length} Yêu cầu
            </span>
          </div>

          <form onSubmit={handleAddSupportRequest} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Hội viên yêu cầu
                </label>
                <select
                  value={newRequestMember}
                  onChange={(e) => setNewRequestMember(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs outline-none"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.name}>{m.name} (#{m.memberId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Loại yêu cầu
                </label>
                <select
                  value={newRequestType}
                  onChange={(e) => setNewRequestType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs outline-none"
                >
                  <option value="Sự cố tủ locker / quên chìa khóa">Sự cố tủ locker / quên chìa khóa</option>
                  <option value="Yêu cầu bảo lưu thẻ hội viên">Yêu cầu bảo lưu thẻ hội viên</option>
                  <option value="Đổi ca tập / xếp lại lớp">Đổi ca tập / xếp lại lớp</option>
                  <option value="Góp ý dịch vụ & thiết bị">Góp ý dịch vụ & thiết bị</option>
                </select>
              </div>

              <div className="sm:col-span-1 flex flex-col justify-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg bg-primary text-secondary-container font-bold text-xs uppercase hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Ghi Nhận Yêu Cầu</span>
                </button>
              </div>
            </div>

            <div>
              <input
                type="text"
                required
                value={newRequestNote}
                onChange={(e) => setNewRequestNote(e.target.value)}
                placeholder="Ghi nội dung chi tiết yêu cầu của hội viên tại quầy..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-slate-900"
              />
            </div>
          </form>

          <div className="space-y-2.5">
            {supportRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900">{req.member}</strong>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                      {req.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{req.time}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{req.note}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      req.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {req.status === 'resolved' ? 'Đã giải quyết' : 'Đang xử lý'}
                  </span>
                  {req.status === 'pending' && (
                    <button
                      onClick={() => {
                        setSupportRequests(
                          supportRequests.map((r) =>
                            r.id === req.id ? { ...r, status: 'resolved' } : r
                          )
                        );
                      }}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                    >
                      Đánh dấu Xong
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Hỗ Trợ Đặt / Hủy Lớp Học Cho Hội Viên */}
      {showClassAssistModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setShowClassAssistModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">event_seat</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
                  Hỗ Trợ Đặt / Hủy Lớp Tại Quầy
                </h3>
                <p className="text-xs text-slate-500">
                  Lễ tân thao tác trực tiếp theo yêu cầu của hội viên
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Chọn Hội viên
                </label>
                <select
                  value={selectedAssistMember}
                  onChange={(e) => setSelectedAssistMember(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (#{m.memberId}) · SĐT: {m.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Chọn Lớp học muốn thao tác
                </label>
                <select
                  value={selectedAssistClass}
                  onChange={(e) => setSelectedAssistClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.time}) · {c.enrolled}/{c.capacity} chỗ
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleClassBookingAssist('book')}
                  className="flex-1 py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Đăng Ký Giữ Chỗ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleClassBookingAssist('cancel')}
                  className="flex-1 py-3 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>Hỗ Trợ Hủy Lớp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Đăng Ký Hội Viên Mới Tại Quầy */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Đăng Ký Hội Viên Mới Tại Quầy
            </h3>

            <form onSubmit={handleCreateNewMember} className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Họ và tên khách hàng
                </label>
                <input
                  type="text"
                  required
                  value={newMemForm.name}
                  onChange={(e) => setNewMemForm({ ...newMemForm, name: e.target.value })}
                  placeholder="Ví dụ: Hoàng Mai Chi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemForm.phone}
                    onChange={(e) => setNewMemForm({ ...newMemForm, phone: e.target.value })}
                    placeholder="0988 123 456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                    Hạng thẻ ban đầu
                  </label>
                  <select
                    value={newMemForm.tier}
                    onChange={(e) => setNewMemForm({ ...newMemForm, tier: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  >
                    <option value="Silver">Silver (Hạng Bạc)</option>
                    <option value="Gold">Gold (Hạng Vàng)</option>
                    <option value="Diamond">Diamond (Kim Cương)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  value={newMemForm.email}
                  onChange={(e) => setNewMemForm({ ...newMemForm, email: e.target.value })}
                  placeholder="khachhang@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Tạo Thẻ & Kích Hoạt
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gia Hạn Gói Tập Tại Quầy */}
      {renewTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative animate-in fade-in">
            <button
              onClick={() => setRenewTarget(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Gia Hạn Thẻ Hội Viên Tại Quầy
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700 border border-slate-200">
              <div>Hội viên: <strong>{renewTarget.name}</strong></div>
              <div>Mã thẻ: <strong>#{renewTarget.memberId}</strong></div>
              <div>Trạng thái: <span className="text-red-600 font-bold">Đã hết hạn</span></div>
            </div>

            <form onSubmit={handleRenewMember} className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Chọn gói gia hạn
                </label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none">
                  <option>Gói Hội Viên Silver 1 Năm (14.280.000 ₫)</option>
                  <option>Gói Hội Viên Gold 1 Năm (26.760.000 ₫)</option>
                  <option>Gói Pickleball Match Pass 10 Buổi (2.500.000 ₫)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Hình thức thanh toán
                </label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none">
                  <option>Tiền mặt tại quầy</option>
                  <option>Chuyển khoản VietQR</option>
                  <option>Quẹt thẻ POS</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-sm"
                >
                  Xác Nhận & Gia Hạn
                </button>
                <button
                  type="button"
                  onClick={() => setRenewTarget(null)}
                  className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ReceptionistLayout>
  );
}
