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
    freezePackage,
    transferPackage,
    issueRfidCard,
    promoteFromWaitlist,
    lockers,
    assignLocker,
    releaseLocker,
    addAuditLog,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCheckInAlert, setActiveCheckInAlert] = useState(null);

  // Modals state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showClassAssistModal, setShowClassAssistModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(null);
  const [showRfidModal, setShowRfidModal] = useState(null);
  const [showLockerModal, setShowLockerModal] = useState(false);
  const [renewTarget, setRenewTarget] = useState(null);

  // New member form (REC-02, REC-03)
  const [newMemForm, setNewMemForm] = useState({
    name: '',
    phone: '',
    email: '',
    tier: 'Silver',
    cccd: '',
  });

  // Freeze form (REC-09)
  const [freezeDays, setFreezeDays] = useState(15);
  const [freezeReason, setFreezeReason] = useState('Chuyến công tác xa');

  // Transfer form (REC-10)
  const [transferTargetName, setTransferTargetName] = useState('');

  // RFID code form (REC-08)
  const [rfidInput, setRfidInput] = useState('');

  // Class assist state (REC-14, REC-15, REC-16)
  const [selectedAssistMember, setSelectedAssistMember] = useState(members[0]?.id || '');
  const [selectedAssistClass, setSelectedAssistClass] = useState(classes[0]?.id || '');

  // Support requests log (REC-22)
  const [supportRequests, setSupportRequests] = useState([
    {
      id: 'req_01',
      member: 'Nguyễn Minh Anh',
      phone: '0987 654 321',
      type: 'Quên vòng tay tủ đồ',
      note: 'Hội viên để quên thẻ từ trong tủ #28, lễ tân đã mở khóa dự phòng xác minh.',
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
    setTimeout(() => setActiveCheckInAlert(null), 4000);
  };

  const handleCreateNewMember = (e) => {
    e.preventDefault();
    if (!newMemForm.name || !newMemForm.phone) return;

    addMember(newMemForm);
    setShowAddMemberModal(false);
    setNewMemForm({ name: '', phone: '', email: '', tier: 'Silver', cccd: '' });
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

  const handleFreezeSubmit = (e) => {
    e.preventDefault();
    if (!showFreezeModal) return;
    freezePackage(showFreezeModal.id, freezeDays, freezeReason);
    setShowFreezeModal(null);
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!showTransferModal || !transferTargetName) return;
    transferPackage(showTransferModal.name, transferTargetName, 250000);
    setShowTransferModal(null);
    setTransferTargetName('');
  };

  const handleRfidSubmit = (e) => {
    e.preventDefault();
    if (!showRfidModal || !rfidInput) return;
    issueRfidCard(showRfidModal.memberId, rfidInput);
    setShowRfidModal(null);
    setRfidInput('');
  };

  const handleRenewMember = (e) => {
    e.preventDefault();
    if (!renewTarget) return;

    addAuditLog('Gia hạn thẻ tại quầy', `Lễ tân đã gia hạn thành công thẻ của hội viên: ${renewTarget.name}`);
    showToast('Gia hạn thành công', `Đã gia hạn thẻ của ${renewTarget.name} thêm 12 tháng!`);
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
    showToast('Đã ghi nhận yêu cầu', `Yêu cầu hỗ trợ của ${newRequestMember} đã được chuyển cho ban quản lý!`, 'info');
  };

  return (
    <ReceptionistLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                FLOW 1, 2 & FLOW 4: RECEPTION, CHECK-IN & SERVICE
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-bold text-slate-900">
              Quầy Tiếp Đón & Điểm Danh Hội Viên
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Quét mã QR/Thẻ RFID, mở cửa tự động, cấp phát tủ đồ và hỗ trợ các thủ tục thẻ hội viên.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowLockerModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>Tủ Đồ & Khăn (REC-13)</span>
            </button>

            <button
              onClick={() => setShowClassAssistModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">event_available</span>
              <span>Đặt / Hủy Lớp Hộ (REC-15)</span>
            </button>

            <button
              onClick={() => setShowAddMemberModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary-container text-primary font-bold text-xs uppercase hover:bg-secondary-fixed-dim transition-all shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Đăng Ký Khách Mới (REC-02)</span>
            </button>
          </div>
        </div>

        {/* Check-in Notification Banner (REC-11, REC-12) */}
        {activeCheckInAlert && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between animate-in zoom-in-95 duration-200 shadow-md ${
              activeCheckInAlert.status === 'expired'
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px]">
                {activeCheckInAlert.status === 'expired' ? 'warning' : 'sensor_door'}
              </span>
              <div>
                <strong className="text-sm font-bold block">
                  {activeCheckInAlert.status === 'expired'
                    ? `CẢNH BÁO: HỘI VIÊN HẾT HẠN THẺ (${activeCheckInAlert.name} - ${activeCheckInAlert.memberId})`
                    : `CỬA ĐÃ MỞ: MỜI HỘI VIÊN ${activeCheckInAlert.name.toUpperCase()} (#${activeCheckInAlert.memberId})`}
                </strong>
                <div className="text-xs">
                  {activeCheckInAlert.status === 'expired'
                    ? 'Gói tập đã hết hạn hoặc vi phạm khung giờ. Cổng kiểm soát KHÔNG mở. Vui lòng thanh toán gia hạn!'
                    : `Hệ thống đã tự động gán Tủ Locker số: ${activeCheckInAlert.locker}. Cửa rào chắn RFID đã mở!`}
                </div>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                activeCheckInAlert.status === 'expired' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {activeCheckInAlert.status === 'expired' ? 'Từ chối vào' : 'Hợp lệ'}
            </span>
          </div>
        )}

        {/* Search & Fast Check-In Form (REC-01, REC-11) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <form onSubmit={handleManualCheckIn} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[22px]">
                qr_code_scanner
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Quét mã QR từ App / Chạm thẻ từ RFID / Nhập SĐT hoặc Mã #ELT-8924..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              <span>Xác Nhận Check-In & Cấp Tủ</span>
            </button>
          </form>
        </div>

        {/* Members Management Table with Action Buttons (REC-04, REC-08, REC-09, REC-10) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
                Hồ Sơ Hội Viên & Thủ Tục Thẻ (REC-04, REC-08, REC-09, REC-10)
              </h2>
              <p className="text-xs text-slate-500">
                Thực hiện cấp thẻ từ RFID, bảo lưu (freeze), chuyển nhượng hoặc gia hạn gói tập tại quầy.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Mã Thẻ</th>
                  <th className="py-2.5 px-3">Họ và Tên</th>
                  <th className="py-2.5 px-3">Số Điện Thoại</th>
                  <th className="py-2.5 px-3">Hạng Thẻ</th>
                  <th className="py-2.5 px-3">Trạng Thái</th>
                  <th className="py-2.5 px-3">Hạn Thẻ</th>
                  <th className="py-2.5 px-3 text-right">Nghiệp vụ quầy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-primary">{m.memberId}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                    <td className="py-2.5 px-3">{m.phone}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                        {m.tier}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status === 'frozen'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {m.status === 'active' ? 'Hoạt động' : m.status === 'frozen' ? 'Bảo lưu' : 'Hết hạn/Khóa'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{m.expires}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setShowRfidModal(m)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] cursor-pointer"
                          title="Cấp thẻ RFID / Quét mã QR"
                        >
                          Cấp RFID
                        </button>
                        <button
                          onClick={() => setShowFreezeModal(m)}
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] cursor-pointer"
                          title="Bảo lưu gói tập"
                        >
                          Bảo lưu
                        </button>
                        <button
                          onClick={() => setShowTransferModal(m)}
                          className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] cursor-pointer"
                          title="Chuyển nhượng gói tập"
                        >
                          Chuyển nhượng
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Queue Cards List (REC-11) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
              Nhật Ký Check-in Cổng Tự Động (REC-11)
            </h2>
            <span className="text-xs text-slate-500 font-mono">Đồng bộ trực tiếp</span>
          </div>

          <div className="space-y-3">
            {checkIns.slice(0, 5).map((item) => (
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
                        className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                      >
                        Gia Hạn Ngay
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">
                        check_circle
                      </span>
                      <span>Cửa Đã Mở</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sổ Tiếp Nhận Yêu Cầu Hỗ Trợ Từ Thành Viên (REC-22) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-sm text-base font-bold text-slate-900 uppercase">
                Tiếp Nhận & Ghi Nhận Yêu Cầu Hỗ Trợ (REC-22)
              </h2>
              <p className="text-xs text-slate-500">
                Ghi chú sự cố tủ đồ, yêu cầu bảo lưu thẻ hoặc ý kiến đóng góp của hội viên.
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
                  className="w-full py-2 px-4 rounded-lg bg-primary text-secondary-container font-bold text-xs uppercase hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
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
                placeholder="Ghi nội dung chi tiết phản ánh của hội viên tại quầy..."
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
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                    >
                      Xong
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: BẢO LƯU GÓI TẬP (REC-09) */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setShowFreezeModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Bảo Lưu Gói Tập (Freeze Membership - REC-09)
            </h3>
            <p className="text-xs text-slate-500">
              Hội viên: <strong>{showFreezeModal.name}</strong> (#{showFreezeModal.memberId})
            </p>

            <form onSubmit={handleFreezeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Thời gian bảo lưu</label>
                <select
                  value={freezeDays}
                  onChange={(e) => setFreezeDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value={15}>15 ngày (Tiêu chuẩn)</option>
                  <option value={30}>30 ngày (1 tháng)</option>
                  <option value={60}>60 ngày (2 tháng)</option>
                  <option value={90}>90 ngày (Tối đa)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Lý do bảo lưu</label>
                <input
                  type="text"
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  placeholder="Công tác / Sức khỏe / Nghỉ thai sản..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase cursor-pointer"
              >
                Xác Nhận Bảo Lưu Thẻ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHUYỂN NHƯỢNG GÓI TẬP (REC-10) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setShowTransferModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Chuyển Nhượng Gói Tập (REC-10)
            </h3>
            <p className="text-xs text-slate-500">
              Chuyển quyền sở hữu thẻ từ hội viên <strong>{showTransferModal.name}</strong> cho người nhận mới.
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Tên người nhận mới</label>
                <input
                  type="text"
                  value={transferTargetName}
                  onChange={(e) => setTransferTargetName(e.target.value)}
                  placeholder="Nhập họ tên người nhận thẻ..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Phí thủ tục chuyển nhượng:</span>
                  <strong className="text-primary font-mono">250.000 ₫</strong>
                </div>
                <div>• Quyền lợi gói và số ngày còn lại sẽ được chuyển toàn bộ sang thẻ mới.</div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase cursor-pointer"
              >
                Xác Nhận Chuyển Nhượng
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CẤP THẺ TỪ RFID / MÃ QR (REC-08) */}
      {showRfidModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setShowRfidModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Cấp Phát Thẻ Từ RFID / Vòng Tay (REC-08)
            </h3>
            <p className="text-xs text-slate-500">
              Gán mã thẻ chip RFID hoặc vòng tay thông minh cho: <strong>{showRfidModal.name}</strong>
            </p>

            <form onSubmit={handleRfidSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Mã thẻ chip / Barcode RFID</label>
                <input
                  type="text"
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  placeholder="Quét mã chip qua đầu đọc hoặc nhập số..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-xs uppercase cursor-pointer"
              >
                Liên Kết Mã Thẻ Vào Hồ Sơ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUẢN LÝ TỦ ĐỒ LOCKER & KHĂN TẬP (REC-13) */}
      {showLockerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowLockerModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Mượn / Trả Đồ & Quản Lý Tủ Locker (REC-13)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {lockers.map((loc) => (
                <div
                  key={loc.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    loc.status === 'in-use'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : loc.status === 'maintenance'
                      ? 'bg-slate-100 border-slate-300 text-slate-400'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  }`}
                >
                  <div className="font-bold flex justify-between">
                    <span>{loc.number}</span>
                    <span className="text-[10px] uppercase font-mono">
                      {loc.status === 'in-use' ? 'Đang dùng' : loc.status === 'maintenance' ? 'Bảo trì' : 'Trống'}
                    </span>
                  </div>
                  <div className="text-[10px] truncate text-slate-500">{loc.area}</div>
                  {loc.assignedTo && <div className="text-[10px] font-semibold truncate">{loc.assignedTo}</div>}
                  {loc.status === 'in-use' && (
                    <button
                      onClick={() => releaseLocker(loc.id)}
                      className="mt-1 w-full py-1 rounded bg-slate-800 text-white text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Mở / Trả tủ
                    </button>
                  )}
                  {loc.status === 'available' && (
                    <button
                      onClick={() => assignLocker('ELT-8924', loc.number)}
                      className="mt-1 w-full py-1 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Cấp tủ
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ĐĂNG KÝ HỘI VIÊN MỚI (REC-02, REC-03) */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in">
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Đăng Ký Hội Viên Mới Tại Quầy (REC-02)
            </h3>

            <form onSubmit={handleCreateNewMember} className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Họ và tên khách</label>
                <input
                  type="text"
                  required
                  value={newMemForm.name}
                  onChange={(e) => setNewMemForm({ ...newMemForm, name: e.target.value })}
                  placeholder="VD: Trần Thị Thanh..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    required
                    value={newMemForm.phone}
                    onChange={(e) => setNewMemForm({ ...newMemForm, phone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Số CCCD/CMND</label>
                  <input
                    type="text"
                    value={newMemForm.cccd}
                    onChange={(e) => setNewMemForm({ ...newMemForm, cccd: e.target.value })}
                    placeholder="0012xxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Gói thành viên đăng ký</label>
                <select
                  value={newMemForm.tier}
                  onChange={(e) => setNewMemForm({ ...newMemForm, tier: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none font-semibold"
                >
                  <option value="Silver">Thẻ Bạc (Silver Member)</option>
                  <option value="Gold">Thẻ Vàng (Gold Member)</option>
                  <option value="Diamond">Thẻ Kim Cương (VIP Diamond)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-primary text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
              >
                Tạo Thẻ & Kích Hoạt Tại Quầy
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ĐẶT / HỦY LỚP HỘ (REC-15, REC-16, REC-17) */}
      {showClassAssistModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in">
            <button
              onClick={() => setShowClassAssistModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <h3 className="font-headline-sm text-lg font-bold text-slate-900 uppercase">
              Hỗ Trợ Đặt / Hủy Lớp Học (REC-15, REC-16)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Chọn hội viên</label>
                <select
                  value={selectedAssistMember}
                  onChange={(e) => setSelectedAssistMember(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} (#{m.memberId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Chọn lớp học</label>
                <select
                  value={selectedAssistClass}
                  onChange={(e) => setSelectedAssistClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.enrolled}/{c.capacity} slot) - {c.time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleClassBookingAssist('book')}
                  className="flex-1 py-3 rounded-xl bg-secondary-container text-primary font-bold text-xs uppercase cursor-pointer"
                >
                  Đặt Chỗ Hộ (REC-15)
                </button>
                <button
                  type="button"
                  onClick={() => handleClassBookingAssist('cancel')}
                  className="flex-1 py-3 rounded-xl bg-red-100 text-red-800 font-bold text-xs uppercase cursor-pointer"
                >
                  Hủy Chỗ Hộ (REC-16)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ReceptionistLayout>
  );
}
