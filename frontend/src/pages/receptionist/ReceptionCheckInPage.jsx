import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReceptionistLayout from '../../components/layouts/ReceptionistLayout';
import { apiRequest } from '../../services/apiClient';
import { checkInReceptionMember, lookupReceptionCard } from '../../services/receptionistApi';
import { getTierBadgeStyle } from '../../utils/memberMemberships';
import { getAvatarImageUrl } from '../../utils/avatarHelper';

const formatDateTime = (value) => new Date(value).toLocaleString('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const formatDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
const bookingStatus = { CONFIRMED: 'Đã xác nhận đặt chỗ', CHECKED_IN: 'Đã vào sân', PENDING: 'Chờ xác nhận', BOOKED: 'Đã đặt chỗ', COMPLETED: 'Đã kết thúc' };
const attendanceStatus = { PENDING: 'Chưa điểm danh lớp', PRESENT: 'Đã điểm danh có mặt', EXCUSED_ABSENCE: 'Đã ghi nhận vắng có phép', UNEXCUSED_ABSENCE: 'Đã ghi nhận vắng không phép' };

function admissionGuide(eligibility) {
  if (eligibility?.eligible) return {
    title: 'Có thể cho học viên vào tập',
    reason: 'Lịch hiện tại đã đáp ứng điều kiện vào tập.',
    next: 'Đối chiếu đúng học viên ở bên trái, sau đó bấm “Xác nhận vào tập”.',
  };
  const reason = eligibility?.reason || '';
  if (/5 phút/.test(reason)) return { title: 'Học viên vừa được check-in', reason: 'Đã ghi nhận lượt vào tập trong 5 phút qua.', next: 'Kiểm tra lịch sử bên dưới. Không cần check-in lại.' };
  if (/nhiều sân/.test(reason)) return { title: 'Chọn sân học viên đến tập', reason: 'Có nhiều lịch sân cùng đủ điều kiện.', next: 'Bấm “Check-in sân này” tại đúng lịch bên dưới.' };
  if (/không còn được giữ|không còn ở trạng thái giữ/.test(reason)) return {
    title: 'Cần kiểm tra lượt tập của lịch này',
    reason: 'Lịch đặt chỗ đã được xác nhận, nhưng lượt tập trong gói không còn được giữ cho lịch này.',
    next: 'Mở danh sách lớp để kiểm tra buổi đã được điểm danh hoặc lượt tập đã được hoàn. Nếu thông tin chưa khớp, nhờ quản lý đối soát trước khi cho vào tập.',
    link: '/receptionist/classes', linkLabel: 'Mở danh sách lớp',
  };
  if (/hết hiệu lực|thiếu quota/.test(reason)) return { title: 'Gói chưa đáp ứng lượt tập này', reason: 'Gói dùng cho lịch này đã hết hiệu lực hoặc không đủ lượt tập đã giữ.', next: 'Kiểm tra gói gắn với lịch. Chỉ gia hạn hoặc thu tiền buổi lẻ sau khi xác nhận với học viên.', link: '/receptionist/pos', linkLabel: 'Mở quầy thu ngân' };
  if (/PAID|chứng từ|thanh toán/.test(reason)) return { title: 'Cần kiểm tra thanh toán', reason: 'Chưa xác minh được khoản thanh toán hợp lệ cho lịch này.', next: 'Đối chiếu giao dịch tại quầy. Nếu học viên đã trả tiền, nhờ quản lý đối soát trước khi thu thêm.', link: '/receptionist/pos', linkLabel: 'Mở quầy thu ngân' };
  if (/khung giờ|đúng giờ|chưa đến giờ/.test(reason)) return { title: 'Chưa có lịch có thể check-in lúc này', reason: 'Không tìm thấy lịch đã xác nhận và đang trong giờ tập, hoặc lịch đã được check-in.', next: 'Đối chiếu giờ bắt đầu, giờ kết thúc và trạng thái lịch bên dưới. Nếu chưa đến giờ, kiểm tra lại khi buổi tập bắt đầu.' };
  if (/không hoạt động/.test(reason)) return { title: 'Tài khoản chưa được phép vào tập', reason: 'Tài khoản học viên đang không hoạt động.', next: 'Mở hồ sơ hội viên và nhờ quản lý kiểm tra trạng thái tài khoản.', link: '/receptionist/members', linkLabel: 'Mở hồ sơ hội viên' };
  return { title: 'Cần kiểm tra trước khi cho vào tập', reason: reason.replace(/quota/gi, 'lượt tập').replace(/booking/gi, 'lịch đặt chỗ') || 'Chưa xác minh được điều kiện vào tập.', next: 'Kiểm tra lịch và thông tin bên dưới. Nếu chưa rõ nguyên nhân, nhờ quản lý đối soát.' };
}

export default function ReceptionCheckInPage() {
  // Card / QR Scan state
  const [scanCode, setScanCode] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [cardProfile, setCardProfile] = useState(null);
  const profileRequest = useRef(0);

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
  const canCheckIn = cardProfile?.checkInEligibility?.eligible === true;
  const guide = admissionGuide(cardProfile?.checkInEligibility);

  // Handle Card / QR Scan lookup
  const handleLookupCard = async (e) => {
    e.preventDefault();
    const code = scanCode.trim();
    if (!code) {
      setError('Vui lòng quét mã QR hoặc nhập mã thẻ từ RFID.');
      return;
    }
    await loadProfile(code);
  };

  const loadProfile = async (code) => {
    const requestId = ++profileRequest.current;
    setLookingUp(true);
    setCardProfile(null);
    setMemberId('');
    setError('');
    setResultMessage('');
    try {
      const profile = await lookupReceptionCard(code);
      if (requestId !== profileRequest.current) return;
      setCardProfile(profile);
      setMemberId(String(profile.userId));
    } catch (err) {
      if (requestId !== profileRequest.current) return;
      setError(err.message || 'Không tìm thấy thẻ hội viên hoặc mã không hợp lệ.');
      setCardProfile(null);
    } finally {
      if (requestId === profileRequest.current) setLookingUp(false);
    }
  };

  // Perform Check-in
  const executeCheckIn = async (targetMemberId, bookingId = null) => {
    if (!targetMemberId || submitting || lookingUp || cardProfile?.userId !== Number(targetMemberId)) return;
    const admission = bookingId == null ? cardProfile.checkInEligibility
      : cardProfile.todayBookings?.find((booking) => booking.bookingType === 'COURT' && booking.bookingId === bookingId)?.checkInEligibility;
    if (!admission?.eligible) {
      setError(admission?.reason || 'Vui lòng tra cứu lại điều kiện check-in.');
      return;
    }
    const requestId = profileRequest.current;
    setSubmitting(true);
    setError('');
    setResultMessage('');
    try {
      const result = await checkInReceptionMember({ memberId: Number(targetMemberId), bookingId });
      setResultMessage(result.result === 'VALID'
        ? `ĐIỂM DANH THÀNH CÔNG: Hội viên ${result.memberName} đủ điều kiện vào tập.`
        : `TỪ CHỐI VÀO TẬP: Tài khoản hội viên ${result.memberName} không hoạt động. Lượt kiểm tra đã được lưu.`);
      await refreshHistory();
    } catch (requestError) {
      setError(admissionGuide({ eligible: false, reason: requestError.message }).reason);
    } finally {
      if (requestId === profileRequest.current) {
        try {
          const profile = await lookupReceptionCard(String(targetMemberId));
          if (requestId === profileRequest.current) setCardProfile(profile);
        } catch {
          if (requestId === profileRequest.current) {
            setCardProfile(null);
            setMemberId('');
            setError('Không thể cập nhật điều kiện check-in. Vui lòng tra cứu lại hội viên.');
          }
        }
      }
      setSubmitting(false);
    }
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
          <div
            role="alert"
            className={`rounded-xl border p-4 text-sm flex items-center gap-2 ${
              error.includes('5 phút')
                ? 'border-amber-300 bg-amber-50 text-amber-900 font-bold'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${error.includes('5 phút') ? 'text-amber-600' : 'text-red-600'}`}>
              {error.includes('5 phút') ? 'info' : 'error'}
            </span>
            <span>{error}</span>
          </div>
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

        {/* 1. KHỐI QUÉT MÃ QR & QUẸT THẺ TỪ RFID */}
        <section className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50/80 via-white to-amber-50/50 p-6 shadow-sm relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-sm shadow-orange-500/20">
                  <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Quét Mã QR hoặc Quẹt Thẻ RFID
                  </h2>
                  <p className="text-xs text-slate-500">Hỗ trợ đầu đọc thẻ RFID và máy quét mã QR tự động</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-orange-100 text-[11px] font-semibold text-orange-800 border border-orange-200 self-start sm:self-auto">
                Tự động nhận dạng mã
              </span>
            </div>

            <form onSubmit={handleLookupCard} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1 flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">
                  contactless
                </span>
                <input
                  type="text"
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  placeholder="Quét mã QR thẻ hội viên hoặc quẹt thẻ từ RFID..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-sm font-mono font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-xs"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={lookingUp || !scanCode.trim()}
                className="py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
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
                <h3 className="font-bold text-slate-900 text-base">Xác nhận học viên vào tập</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  profileRequest.current += 1;
                  setCardProfile(null);
                  setMemberId('');
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
                <p className="mb-3 text-xs font-bold text-slate-600">1. Đối chiếu đúng học viên</p>
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-sm flex items-center justify-center bg-slate-800">
                  {getAvatarImageUrl(cardProfile.avatar) ? (
                    <img src={getAvatarImageUrl(cardProfile.avatar)} alt={cardProfile.fullName} className="w-full h-full object-cover" />
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
                    getTierBadgeStyle(cardProfile.tier || cardProfile.tierBadge, 'light')
                  }`}>
                    {cardProfile.tierBadge || 'HỘI VIÊN CHÍNH THỨC'}
                  </span>
                </div>
                <p className="mt-4 text-xs text-slate-500">Thẻ RFID: {cardProfile.rfidCode || 'Chưa gán thẻ — có thể check-in thủ công'}</p>
              </div>

              {/* Chi tiết gói & Trạng thái vào tập */}
              <div className="md:col-span-8 space-y-4">
                <div className={`rounded-2xl border p-5 ${canCheckIn ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="material-symbols-outlined text-[26px]">{canCheckIn ? 'check_circle' : 'info'}</span>
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold">{guide.title}</h4>
                      <p className="text-sm leading-6">{guide.reason}</p>
                      <div className="rounded-xl bg-white/70 p-3 text-sm leading-6">
                        <p className="font-bold">Lễ tân cần làm gì?</p>
                        <p>{guide.next}</p>
                        {guide.link && <Link to={guide.link} className="mt-2 inline-block font-bold underline underline-offset-4">{guide.linkLabel} →</Link>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <h4 className="font-bold text-sm text-slate-900">2. Kiểm tra lịch đến tập hôm nay</h4>
                  <p className="text-xs text-slate-500">Đã xác nhận đặt chỗ nghĩa là đã có lịch. Điều kiện vào tập được kiểm tra riêng.</p>
                  {cardProfile.todayBookings?.length ? cardProfile.todayBookings.map((b) => (
                    <div key={`${b.bookingType || 'CLASS'}-${b.bookingId}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm text-slate-900">{b.courtName || b.title || b.activity}</strong>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">{bookingStatus[b.status] || 'Cần kiểm tra trạng thái'}</span>
                      </div>
                      <p className="text-sm text-slate-700">{formatDateTime(b.startTime)} – {formatDateTime(b.endTime)}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span>{b.bookingType === 'COURT' ? 'Đặt sân' : 'Lớp học / buổi huấn luyện'}</span>
                        {b.usesMembershipQuota != null && <span>{b.usesMembershipQuota ? 'Sử dụng lượt trong gói' : 'Thanh toán theo buổi'}</span>}
                        {b.attendanceStatus && <span>{attendanceStatus[b.attendanceStatus] || 'Cần kiểm tra điểm danh lớp'}</span>}
                      </div>
                      {b.bookingType === 'COURT' && b.status === 'CONFIRMED' && (
                        <div className="pt-1">
                          <button type="button" disabled={submitting || !b.checkInEligibility?.eligible} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed" onClick={() => executeCheckIn(cardProfile.userId, b.bookingId)}>Check-in sân này</button>
                          {!b.checkInEligibility?.eligible && <p className="mt-2 text-xs text-slate-600">{admissionGuide(b.checkInEligibility).reason}</p>}
                        </div>
                      )}
                    </div>
                  )) : <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Hôm nay chưa có lịch đặt lớp hoặc sân. Kiểm tra lại lịch với học viên trước khi check-in.</p>}
                </div>

                <div className="space-y-3">
                  <button type="button" disabled={submitting || !canCheckIn} onClick={() => executeCheckIn(cardProfile.userId)}
                    className={`w-full rounded-xl px-6 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed ${canCheckIn ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'border border-slate-200 bg-slate-100 text-slate-500'}`}>
                    {submitting ? 'Đang ghi nhận...' : canCheckIn ? 'Xác nhận vào tập' : 'Chưa thể xác nhận vào tập'}
                  </button>
                  <button type="button" disabled={submitting || lookingUp} onClick={() => loadProfile(String(cardProfile.userId))} className="text-sm font-semibold text-blue-700 disabled:opacity-50">Kiểm tra lại sau khi xử lý</button>
                </div>

                <details className="rounded-xl border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">Thông tin gói tập ({cardProfile.activePackages?.length || 0} gói còn hạn)</summary>
                  <p className="mt-3 text-xs leading-5 text-slate-500">Gói còn hạn chưa có nghĩa là buổi tập này đủ điều kiện. Cần kiểm tra số lượt và gói được dùng cho lịch.</p>
                  <div className="mt-3 space-y-3">
                    {cardProfile.activePackages?.length ? cardProfile.activePackages.map((pkg) => (
                      <div key={pkg.membershipId} className="rounded-xl bg-slate-50 p-3 text-xs space-y-2">
                        <p className="font-bold text-slate-900">{pkg.packageName}</p>
                        <p className="text-slate-600">{formatDate(pkg.startDate)} – {formatDate(pkg.endDate)} · Còn hạn {pkg.daysRemaining} ngày</p>
                        {pkg.remainingSessions != null && <p className="text-slate-700">Có thể đặt thêm: <strong>{pkg.remainingSessions} buổi</strong> · Đã giữ cho lịch: <strong>{pkg.heldSessions} buổi</strong> · Đã dùng: {pkg.usedSessions} buổi</p>}
                        {pkg.remainingCourtHours != null && <p className="text-slate-700">Có thể đặt thêm: <strong>{pkg.remainingCourtHours} giờ sân</strong> · Đã giữ cho lịch: <strong>{pkg.heldCourtHours} giờ</strong> · Đã dùng: {pkg.usedCourtHours} giờ</p>}
                      </div>
                    )) : <p className="text-xs text-slate-600">Chưa có gói còn hạn. Học viên vẫn có thể sử dụng lịch thanh toán theo buổi nếu đáp ứng điều kiện.</p>}
                  </div>
                </details>
              </div>
            </div>
          </section>
        )}

        {/* 3. KHỐI TÌM KIẾM THỦ CÔNG (DỰ PHÒNG KHI KHÔNG CÓ THẺ/ĐIỆN THOẠI) */}
        <form onSubmit={(event) => event.preventDefault()} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
              profileRequest.current += 1;
              setSearch(event.target.value);
              setMemberId('');
              setCardProfile(null);
              setLookingUp(false);
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
                    onClick={() => loadProfile(String(member.userId))}
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

          <p className="text-xs text-slate-500">Chọn học viên để mở hồ sơ. Xác nhận vào tập tại hồ sơ phía trên sau khi kiểm tra lịch.</p>
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
                          <span>{entry.result === 'VALID' ? 'Hợp lệ (Được vào)' : 'Từ chối (Không đủ điều kiện)'}</span>
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
