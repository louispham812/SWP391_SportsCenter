import React, { useState, useEffect, useMemo } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { getMemberAttendance } from '../../services/memberApi';
import { useApp } from '../../context/AppContext';

export default function MemberAttendancePage() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    totalSessions: 0,
    attendedSessions: 0,
    absentSessions: 0,
    attendanceRate: 0,
    records: [],
    courtBookings: [],
    checkIns: [],
  });

  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'courts' | 'gate'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PRESENT' | 'EXCUSED_ABSENCE' | 'UNEXCUSED_ABSENCE' | 'REGISTERED'
  const [searchQuery, setSearchQuery] = useState('');

  // Dispute modal state (MEM-19)
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeItem, setDisputeItem] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const handleOpenDispute = (item) => {
    setDisputeItem(item);
    setDisputeReason('');
    setIsDisputeModalOpen(true);
  };

  const handleSubmitDispute = (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setIsDisputeModalOpen(false);
    showToast(
      'Gửi khiếu nại thành công (MEM-19)',
      'Yêu cầu rà soát điểm danh của bạn đã được chuyển tới Ban Quản lý trung tâm để đối soát dữ liệu cổng RFID & camera.',
      'success'
    );
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMemberAttendance();
      setAttendanceData({
        totalSessions: data.totalSessions || 0,
        attendedSessions: data.attendedSessions || 0,
        absentSessions: data.absentSessions || 0,
        attendanceRate: data.attendanceRate || 0,
        records: data.records || [],
        courtBookings: data.courtBookings || [],
        checkIns: data.checkIns || [],
      });
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setError('Không thể tải dữ liệu điểm danh. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return (attendanceData.records || []).filter((rec) => {
      const st = rec.attendanceStatus || rec.status;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PRESENT' && (st === 'ATTENDED' || st === 'PRESENT')) ||
        (statusFilter === 'EXCUSED_ABSENCE' && st === 'EXCUSED_ABSENCE') ||
        (statusFilter === 'UNEXCUSED_ABSENCE' && (st === 'UNEXCUSED_ABSENCE' || st === 'ABSENT')) ||
        (statusFilter === 'REGISTERED' && (st === 'REGISTERED' || st === 'CONFIRMED' || st === 'PENDING'));

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (rec.className && rec.className.toLowerCase().includes(q)) ||
        (rec.sportName && rec.sportName.toLowerCase().includes(q)) ||
        (rec.coachName && rec.coachName.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [attendanceData.records, statusFilter, searchQuery]);

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return {
        date: d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (e) {
      return { date: isoStr, time: '' };
    }
  };

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">fact_check</span>
              Chuyên Cần & Huấn Luyện
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Lịch Sử Điểm Danh & Kết Quả Tập
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi chi tiết sự chuyên cần của bạn qua từng buổi học, lượt qua cổng RFID và nhận xét từ huấn luyện viên.
            </p>
          </div>
          <button
            onClick={fetchAttendance}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-orange-600 text-xs font-bold shadow-sm transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            Làm mới dữ liệu
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Buổi Học</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">event_note</span>
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-slate-900">
              {attendanceData.totalSessions}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Buổi đã lên lịch</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Tham Gia</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-emerald-600">
              {attendanceData.attendedSessions}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Buổi có mặt tập luyện</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vắng Mặt</span>
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">cancel</span>
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-red-600">
              {attendanceData.absentSessions}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Buổi vắng không phép</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỉ Lệ Chuyên Cần</span>
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-orange-600">
              {attendanceData.attendanceRate}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, attendanceData.attendanceRate))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs & Filters */}
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('classes')}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'classes'
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">school</span>
                Điểm Danh Lớp Học ({attendanceData.records.length})
              </button>
              <button
                onClick={() => setActiveTab('courts')}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'courts'
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">sports_tennis</span>
                Lịch Sử Đặt Sân ({attendanceData.courtBookings?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('gate')}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'gate'
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                Quét Thẻ Cổng RFID ({attendanceData.checkIns.length})
              </button>
            </div>

            {activeTab === 'classes' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Search */}
                <div className="relative">
                  <span className="material-symbols-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm theo lớp, HLV..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-56 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Status select (MEM-19) */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PRESENT">Đã tham gia (Có mặt)</option>
                  <option value="EXCUSED_ABSENCE">Vắng có phép (MEM-19)</option>
                  <option value="UNEXCUSED_ABSENCE">Vắng không phép (MEM-19)</option>
                  <option value="REGISTERED">Đã đăng ký (Sắp diễn ra)</option>
                </select>
              </div>
            )}
          </div>

          {/* Tab 1: Class Sessions */}
          {activeTab === 'classes' && (
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Đang tải lịch sử điểm danh...</span>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl border border-red-100 text-xs">
                  {error}
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-[32px]">assignment_turned_in</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Chưa có bản ghi điểm danh</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {searchQuery || statusFilter !== 'ALL'
                      ? 'Không tìm thấy buổi học nào khớp với bộ lọc hiện tại.'
                      : 'Bạn chưa có buổi học nào được ghi nhận điểm danh. Hãy đăng ký lớp học và tham gia đúng giờ!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecords.map((record) => {
                    const startDt = formatDateTime(record.startTime);
                    const endDt = formatDateTime(record.endTime);
                    const st = record.attendanceStatus || record.status;
                    const isPresent = st === 'ATTENDED' || st === 'PRESENT';
                    const isExcused = st === 'EXCUSED_ABSENCE';
                    const isUnexcused = st === 'UNEXCUSED_ABSENCE' || st === 'ABSENT';

                    return (
                      <div
                        key={record.bookingId}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          isPresent
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : isExcused
                            ? 'bg-amber-50/30 border-amber-200'
                            : isUnexcused
                            ? 'bg-red-50/20 border-red-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                isPresent
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isExcused
                                  ? 'bg-amber-100 text-amber-700'
                                  : isUnexcused
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[24px]">
                                {isPresent ? 'verified' : isExcused ? 'event_available' : isUnexcused ? 'event_busy' : 'schedule'}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900">{record.className}</h4>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {record.sportName || 'Thể thao'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                                <span className="inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[15px] text-slate-400">calendar_today</span>
                                  {startDt.date}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
                                  {startDt.time} - {endDt.time}
                                </span>
                                {record.coachName && (
                                  <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                                    <span className="material-symbols-outlined text-[15px] text-orange-500">sports</span>
                                    HLV: {record.coachName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5 self-end sm:self-auto">
                            {isPresent && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Có mặt
                              </span>
                            )}
                            {isExcused && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                Vắng có phép (MEM-19)
                              </span>
                            )}
                            {isUnexcused && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                Vắng không phép
                              </span>
                            )}
                            {!isPresent && !isExcused && !isUnexcused && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                Đã đăng ký
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenDispute(record)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 text-[11px] font-bold transition cursor-pointer"
                              title="Gửi khiếu nại nếu bị ghi nhầm điểm danh (MEM-19)"
                            >
                              <span className="material-symbols-outlined text-[13px]">report_problem</span>
                              <span>Khiếu nại</span>
                            </button>
                          </div>
                        </div>

                        {/* Coach feedback if available */}
                        {record.coachNote && (
                          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-start gap-2.5 bg-white/80 p-3 rounded-xl border border-slate-200">
                            <span className="material-symbols-outlined text-orange-500 text-[18px] shrink-0 mt-0.5">
                              comment
                            </span>
                            <div className="text-xs">
                              <span className="font-bold text-slate-800">Nhận xét từ HLV {record.coachName || ''}: </span>
                              <span className="text-slate-600 italic">"{record.coachNote}"</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Court Bookings (MEM-19) */}
          {activeTab === 'courts' && (
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Đang tải lịch sử đặt sân...</span>
                </div>
              ) : !attendanceData.courtBookings || attendanceData.courtBookings.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-[32px]">sports_tennis</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Chưa có lượt đặt sân tập nào</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Bạn chưa có đơn đặt sân thể thao nào. Hãy vào mục Đặt Sân để giữ chỗ tập luyện cùng bạn bè!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendanceData.courtBookings.map((court) => {
                    const startDt = formatDateTime(court.startTime);
                    const endDt = formatDateTime(court.endTime);
                    return (
                      <div
                        key={court.bookingId}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[24px]">stadium</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900">{court.courtName}</h4>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">
                                {court.sportName || 'Thể thao'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                              <span className="inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px] text-slate-400">calendar_today</span>
                                {startDt.date}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
                                {startDt.time} - {endDt.time}
                              </span>
                              {court.totalPrice != null && (
                                <span className="inline-flex items-center gap-1 text-slate-900 font-bold">
                                  {Number(court.totalPrice).toLocaleString()}₫
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            court.status === 'CONFIRMED' || court.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {court.status === 'CONFIRMED' || court.status === 'PAID' ? 'Đã xác nhận' : court.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenDispute(court)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 text-[11px] font-bold transition cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">report_problem</span>
                            <span>Khiếu nại</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: RFID Gate Check-ins */}
          {activeTab === 'gate' && (
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Đang tải nhật ký ra vào...</span>
                </div>
              ) : attendanceData.checkIns.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-[32px]">door_front</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Chưa có lượt quét thẻ tại cổng</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Mỗi khi bạn quét mã QR thẻ số hoặc thẻ từ tại cổng Turnstile của trung tâm, lịch sử sẽ xuất hiện tại đây.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Thời Gian Quét Thẻ</th>
                        <th className="py-3 px-4">Cổng Ra Vào</th>
                        <th className="py-3 px-4">Tên Hội Viên</th>
                        <th className="py-3 px-4 text-right">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceData.checkIns.map((item) => {
                        const dt = formatDateTime(item.checkedInAt);
                        return (
                          <tr key={item.checkInId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                                  check_circle
                                </span>
                                <div>
                                  <div>{dt.time}</div>
                                  <div className="text-[11px] text-slate-400 font-normal">{dt.date}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
                                <span className="material-symbols-outlined text-[14px] text-slate-500">meeting_room</span>
                                {item.gate || 'Cổng chính - Turnstile A1'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              {item.memberName || 'Hội viên'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                Hợp lệ
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dispute Modal (MEM-19) */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">report_problem</span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Khiếu Nại Điểm Danh (MEM-19)</h3>
                  <p className="text-xs text-slate-500">{disputeItem?.className || disputeItem?.courtName || 'Buổi tập'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDisputeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                ℹ️ Nếu bạn có mặt nhưng bị ghi vắng, hoặc có việc đột xuất cần duyệt <strong>Vắng có phép</strong>, vui lòng gửi phản hồi để Quản lý trung tâm đối soát lịch sử quét cổng RFID và hỗ trợ bạn.
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-slate-700">Lý do khiếu nại chi tiết *</label>
                <textarea
                  required
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Ghi rõ thông tin: Có mặt tại lớp lúc mấy giờ, HLV nào phụ trách hoặc lý do xin nghỉ có phép..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Gửi Khiếu Nại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
