import React, { useState, useEffect, useMemo } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { getMemberAttendance } from '../../services/memberApi';

export default function MemberAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    totalSessions: 0,
    attendedSessions: 0,
    absentSessions: 0,
    pendingSessions: 0,
    attendanceRate: 0,
    records: [],
    gateCheckIns: [],
  });

  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'gate'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PRESENT' | 'ABSENT' | 'REGISTERED'
  const [searchQuery, setSearchQuery] = useState('');

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
        pendingSessions: data.pendingSessions || 0,
        attendanceRate: data.attendanceRate || 0,
        records: data.records || [],
        gateCheckIns: data.gateCheckIns || [],
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
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PRESENT' && (rec.attendanceStatus === 'PRESENT')) ||
        (statusFilter === 'ABSENT' && (rec.attendanceStatus === 'ABSENT' || rec.attendanceStatus === 'UNEXCUSED_ABSENCE')) ||
        (statusFilter === 'REGISTERED' && (rec.attendanceStatus === 'PENDING'));

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
                onClick={() => setActiveTab('gate')}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'gate'
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                Quét Thẻ Cổng RFID ({attendanceData.gateCheckIns.length})
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

                {/* Status select */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PRESENT">Đã tham gia (Có mặt)</option>
                  <option value="ABSENT">Vắng mặt</option>
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
                    const isPresent = record.attendanceStatus === 'PRESENT';
                    const isAbsent = record.attendanceStatus === 'ABSENT' || record.attendanceStatus === 'UNEXCUSED_ABSENCE';
                    const isPending = record.attendanceStatus === 'PENDING';

                    return (
                      <div
                        key={record.bookingId}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          isPresent
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : isAbsent
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
                                  : isAbsent
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[24px]">
                                {isPresent ? 'verified' : isAbsent ? 'event_busy' : 'schedule'}
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

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            {isPresent && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Có mặt
                              </span>
                            )}
                            {isAbsent && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                Vắng mặt
                              </span>
                            )}
                            {!isPresent && !isAbsent && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                Đã đăng ký
                              </span>
                            )}
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

          {/* Tab 2: RFID Gate Check-ins */}
          {activeTab === 'gate' && (
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Đang tải nhật ký ra vào...</span>
                </div>
              ) : attendanceData.gateCheckIns.length === 0 ? (
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
                        <th className="py-3 px-4 text-right">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceData.gateCheckIns.map((item) => {
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
                                {item.location || 'Cổng chính - Turnstile A1'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              {item.result === 'SUCCESS' ? 'Thành công' : item.result || 'Hợp lệ'}
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
    </MemberLayout>
  );
}
