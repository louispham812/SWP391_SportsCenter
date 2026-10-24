import React, { useCallback, useEffect, useState } from 'react';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { apiRequest } from '../../services/apiClient';
import { checkInReceptionMember, lookupReceptionCard } from '../../services/receptionistApi';

const formatDateTime = (value) => new Date(value).toLocaleString('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export default function ReceptionCheckInPage() {
  // Card / QR Scan state
  const [scanCode, setScanCode] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [cardProfile, setCardProfile] = useState(null);

  // Manual search state
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const refreshHistory = useCallback(async () => {
    try {
      const rows = await apiRequest('/receptionist/check-ins');
      setHistory(rows);
    } catch (requestError) {
      setError(`Check-in đã được ghi nhận nhưng không thể tải lại lịch sử: ${requestError.message || 'Lỗi không xác định.'}`);
    }
  }, []);

  useEffect(() => {
    let current = true;
    const loadHistory = async () => {
      try {
        const rows = await apiRequest('/receptionist/check-ins');
        if (current) setHistory(rows);
      } catch (requestError) {
        if (current) setError(requestError.message || 'Không thể tải lịch sử check-in.');
      } finally {
        if (current) setLoadingHistory(false);
      }
    };
    void loadHistory();
    return () => {
      current = false;
    };
  }, []);

  // Debounced search for manual lookup
  useEffect(() => {
    let current = true;
    if (search.trim().length < 2) {
      setMembers([]);
      return () => {
        current = false;
      };
    }
    const timeoutId = window.setTimeout(() => {
      apiRequest(`/receptionist/members?query=${encodeURIComponent(search.trim())}&page=0&size=20`)
        .then((result) => {
          if (current) setMembers(result.content || []);
        })
        .catch((requestError) => {
          if (current) setError(requestError.message || 'Không thể tìm hội viên.');
        });
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const selectedMember = members.find((member) => member.userId === Number(memberId));

  // Handle Card / QR Scan lookup
  const handleLookupCard = async (e) => {
    e.preventDefault();
    const code = scanCode.trim();
    if (!code) {
      setError('Vui lòng quét mã QR hoặc nhập mã thẻ từ RFID.');
      return;
    }
    setLookingUp(true);
    setError('');
    setResultMessage('');
    try {
      const profile = await lookupReceptionCard(code);
      setCardProfile(profile);
      setMemberId(String(profile.userId));
    } catch (err) {
      setError(err.message || 'Không tìm thấy thẻ hội viên hoặc mã không hợp lệ.');
      setCardProfile(null);
    } finally {
      setLookingUp(false);
    }
  };

  // Perform Check-in
  const executeCheckIn = async (targetMemberId) => {
    if (!targetMemberId) return;
    setSubmitting(true);
    setError('');
    setResultMessage('');
    try {
      const result = await checkInReceptionMember({ memberId: Number(targetMemberId) });
      setResultMessage(result.result === 'VALID'
        ? `ĐIỂM DANH THÀNH CÔNG: Hội viên ${result.memberName} đủ điều kiện vào tập.`
        : `TỪ CHỐI VÀO TẬP: Hội viên ${result.memberName} không đủ điều kiện (hết hạn hoặc chưa kích hoạt gói). Lượt kiểm tra đã được lưu.`);
      await refreshHistory();
    } catch (requestError) {
      setError(requestError.message || 'Không thể ghi nhận check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualCheckIn = async (event) => {
    event.preventDefault();
    if (!memberId) {
      setError('Vui lòng tìm và chọn hội viên trước khi check-in.');
      return;
    }
    await executeCheckIn(memberId);
  };

  return (
    <ReceptionistLayout>
      <main className="space-y-6">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            F SPORT RECEPTION · TIẾP ĐÓN &amp; ĐIỂM DANH
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Tiếp Đón &amp; Điểm Danh Quầy</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quét mã QR cá nhân hoặc quẹt thẻ từ RFID, đối chiếu ảnh nhận diện khuôn mặt và ghi nhận lượt vào tập.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-red-600">error</span>
            <span>{error}</span>
          </p>
        )}
        {resultMessage && (
          <div role="status" className={`rounded-xl border p-4 text-sm flex items-center gap-2 font-bold ${
            resultMessage.includes('THÀNH CÔNG')
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}>
            <span className="material-symbols-outlined text-[20px]">
              {resultMessage.includes('THÀNH CÔNG') ? 'verified' : 'warning'}
            </span>
            <span>{resultMessage}</span>
          </div>
        )}

        {/* 1. KHỐI QUÉT MÃ QR & QUẸT THẺ TỪ RFID (REC-08, MEM-10) */}
        <section className="rounded-2xl border-2 border-orange-500/50 bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950 p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                </span>
                <div>
                  <h2 className="font-headline-sm text-base font-black uppercase tracking-tight text-white">
                    Quét Mã QR Hoặc Quẹt Thẻ Từ RFID
                  </h2>
                  <p className="text-xs text-orange-200/80">Hỗ trợ đầu đọc mã vạch / QR 2D và đầu quét thẻ RFID USB</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-400/40 text-[11px] font-bold text-orange-300 self-start sm:self-auto">
                Tự động nhận dạng mã
              </span>
            </div>

            <form onSubmit={handleLookupCard} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-slate-400 text-[20px]">
                  contactless
                </span>
                <input
                  type="text"
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  placeholder="Quét mã QR (SPORTHUB-MEMBER-...) hoặc quẹt thẻ từ (RFID-SH-...)..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-sm font-mono font-bold text-white placeholder-slate-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={lookingUp || !scanCode.trim()}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-orange-500/30 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                <span>{lookingUp ? 'Đang tra cứu...' : 'Tra Cứu Thẻ'}</span>
              </button>
            </form>
          </div>
        </section>

        {/* 2. HỒ SƠ NHẬN DIỆN KHÁCH HÀNG (FACIAL VERIFICATION & ACTIVE PACKAGES) */}
        {cardProfile && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-bold text-slate-900 text-base uppercase">Hồ Sơ Nhận Diện &amp; Đối Chiếu Điểm Danh</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCardProfile(null);
                  setScanCode('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                <span>Đóng hồ sơ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Ảnh nhận diện lớn để đối chiếu mặt */}
              <div className="md:col-span-4 flex flex-col items-center text-center p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className={`w-36 h-36 rounded-2xl overflow-hidden border-4 shadow-xl flex items-center justify-center bg-slate-800 ${
                  cardProfile.activePackages?.length ? 'border-emerald-500' : 'border-amber-500'
                }`}>
                  {cardProfile.avatar ? (
                    <img src={cardProfile.avatar} alt={cardProfile.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white">
                      {cardProfile.fullName?.slice(0, 2).toUpperCase() || 'MB'}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <div className="text-sm font-black text-slate-900 uppercase">{cardProfile.fullName}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">#{cardProfile.userId} · {cardProfile.phone || 'Chưa có SĐT'}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{cardProfile.email}</div>
                </div>
                <div className="mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    cardProfile.tier === 'VIP'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : cardProfile.tier === 'STANDARD'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {cardProfile.tierBadge || 'HỘI VIÊN CHÍNH THỨC'}
                  </span>
                </div>
              </div>

              {/* Chi tiết gói & Trạng thái vào tập */}
              <div className="md:col-span-8 space-y-4">
                {/* Trạng thái vào tập */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  cardProfile.activePackages?.length
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[28px]">
                      {cardProfile.activePackages?.length ? 'check_circle' : 'cancel'}
                    </span>
                    <div>
                      <div className="font-black text-sm uppercase">
                        {cardProfile.activePackages?.length ? 'ĐỦ ĐIỀU KIỆN VÀO TẬP' : 'KHÔNG ĐỦ ĐIỀU KIỆN'}
                      </div>
                      <div className="text-xs opacity-90">
                        {cardProfile.activePackages?.length
                          ? `Có ${cardProfile.activePackages.length} gói tập đang còn hiệu lực.`
                          : 'Hội viên chưa có gói tập hợp lệ hoặc các gói đã hết hạn.'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/80 border">
                    RFID: {cardProfile.rfidCode || 'Chưa gán'}
                  </span>
                </div>

                {/* Danh sách gói tập hiệu lực */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Gói Tập Hiệu Lực Của Hội Viên:
                  </div>
                  {cardProfile.activePackages?.length ? (
                    cardProfile.activePackages.map((pkg) => (
                      <div key={pkg.membershipId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{pkg.packageName}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            Thời hạn: {pkg.startDate} &rarr; {pkg.endDate}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-black">
                          Còn {pkg.remainingDays} ngày
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic p-2">Không có gói tập nào đang kích hoạt.</p>
                  )}
                </div>

                {/* Lịch tập & Đặt sân hôm nay */}
                {cardProfile.todayBookings && cardProfile.todayBookings.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
                    <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">event_available</span>
                      <span>Lịch Đặt Chỗ Hôm Nay:</span>
                    </div>
                    {cardProfile.todayBookings.map((b) => (
                      <div key={b.bookingId} className="flex justify-between items-center text-[11px] bg-white p-2 rounded-lg border border-blue-100">
                        <span><strong>{b.courtName || b.activity}</strong> ({b.startTime} - {b.endTime})</span>
                        <span className="font-bold text-blue-700 uppercase">{b.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nút Check-in trực tiếp */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => executeCheckIn(cardProfile.userId)}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                    <span>{submitting ? 'Đang ghi nhận check-in...' : 'XÁC NHẬN CHO VÀO TẬP (CHECK-IN NGAY)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. KHỐI TÌM KIẾM THỦ CÔNG (DỰ PHÒNG KHI KHÔNG CÓ THẺ/ĐIỆN THOẠI) */}
        <form onSubmit={handleManualCheckIn} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold uppercase text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-slate-500">manage_search</span>
              <span>Tìm kiếm hội viên thủ công (Dự phòng)</span>
            </h3>
            <span className="text-xs text-slate-400">Theo tên, email hoặc SĐT</span>
          </div>

          <input
            id="member-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setMemberId('');
            }}
            placeholder="Nhập tên, số điện thoại hoặc email (tối thiểu 2 ký tự)..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />

          {search.trim().length >= 2 && (
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {members.length === 0 ? (
                <p className="text-xs text-slate-500 p-2">Không tìm thấy hội viên phù hợp.</p>
              ) : (
                members.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => {
                      setMemberId(String(member.userId));
                      lookupReceptionCard(String(member.userId)).then(setCardProfile).catch(() => {});
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition-all flex items-center justify-between ${
                      memberId === String(member.userId)
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/15'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <strong className="block text-sm text-slate-900">{member.fullName}</strong>
                      <span className="text-xs text-slate-500">{member.phone || member.email}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">#{member.userId}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {selectedMember && (
            <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 p-3 text-sm text-orange-900">
              <span className="material-symbols-outlined text-orange-600 text-[18px]">account_circle</span>
              <span>Đã chọn: <strong>{selectedMember.fullName}</strong> ({selectedMember.phone || selectedMember.email})</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!memberId || submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            {submitting ? 'Đang xác minh...' : 'Xác minh và điểm danh'}
          </button>
        </form>

        {/* 4. LỊCH SỬ CHECK-IN GẦN ĐÂY */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 flex items-center justify-between">
            <h2 className="font-bold uppercase text-slate-900 text-sm">Lịch sử check-in hôm nay</h2>
            <button
              type="button"
              onClick={refreshHistory}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Làm mới</span>
            </button>
          </div>
          {loadingHistory ? (
            <p role="status" className="p-5 text-sm text-slate-500">Đang tải lịch sử...</p>
          ) : history.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Chưa có lượt check-in nào trong phiên làm việc.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Hội viên</th>
                    <th className="px-5 py-3">Liên hệ</th>
                    <th className="px-5 py-3">Thời gian</th>
                    <th className="px-5 py-3">Kết quả xác minh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((entry) => (
                    <tr key={entry.checkInId} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {entry.memberName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{entry.phone || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono">{formatDateTime(entry.checkedInAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          entry.result === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <span className="material-symbols-outlined text-[13px]">
                            {entry.result === 'VALID' ? 'check' : 'close'}
                          </span>
                          <span>{entry.result === 'VALID' ? 'Hợp lệ (Được vào)' : 'Từ chối (Hết hạn)'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </ReceptionistLayout>
  );
}
