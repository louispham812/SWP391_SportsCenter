import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';
import { checkoutBooking, getAvailableCourtSlots, getBookableClasses, getBookingCoaches, getBookingQuote, getBookingSports } from '../../services/bookingApi';
import { apiRequest, generatePayment } from '../../services/apiClient';
import { redirectToPayment } from '../../services/paymentNavigation';
import PaymentMethodSelector from '../../components/common/PaymentMethodSelector';
import { getSportMedia } from '../../utils/mediaMap';

const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(amount || 0);

const formatDate = (value) => new Date(value).toLocaleString('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function PageFrame({ title, description, children }) {
  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <Link to="/member/book" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-orange-600 transition">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Booking hội viên
          </Link>
          <h1 className="mt-2 font-headline-xl text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </header>
        {children}
      </div>
    </MemberLayout>
  );
}

function ErrorNotice({ error }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">error</span>
      <span>{error}</span>
    </div>
  );
}

function toLocalDateStr(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCoachCandidateSlotsForDate(availabilityJson, selectedDate) {
  const defaultSlots = ['08:00', '10:00', '14:00', '16:00', '18:00', '19:30'];
  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const filterPast = (slots) => {
    if (selectedDate !== todayStr) return slots;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return slots.filter((slot) => {
      const [h, m] = slot.split(':').map(Number);
      return h * 60 + m > nowMin + 15;
    });
  };
  if (!availabilityJson || availabilityJson.trim() === '{}' || availabilityJson.trim() === '[]') {
    return filterPast(defaultSlots);
  }
  try {
    const parsed = JSON.parse(availabilityJson);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return filterPast(defaultSlots);
    }
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const targetDate = new Date(`${selectedDate}T00:00:00`);
    const targetDay = dayNames[targetDate.getDay()];
    const dayCfg = parsed.find((d) => String(d.day || '').toUpperCase() === targetDay);
    if (!dayCfg) return [];
    const openSlots = defaultSlots.filter((slot) => {
      const hour = Number(slot.split(':')[0]);
      const shift = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      return Boolean(dayCfg[shift]);
    });
    return filterPast(openSlots);
  } catch {
    return filterPast(defaultSlots);
  }
}

function BookingHome() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const preselectSlug = params.get('sportSlug') || '';
  const preselectSportId = params.get('sportId') || '';
  const [matchedSport, setMatchedSport] = useState(null);

  useEffect(() => {
    if (!preselectSlug && !preselectSportId) {
      setMatchedSport(null);
      return;
    }
    let current = true;
    getBookingSports()
      .then((sports) => {
        if (!current || !Array.isArray(sports)) return;
        const found = sports.find(
          (s) =>
            (preselectSportId && String(s.sportId) === String(preselectSportId)) ||
            (preselectSlug && (s.slug === preselectSlug || s.code === preselectSlug)),
        );
        if (found) setMatchedSport(found);
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [preselectSlug, preselectSportId]);

  const buildOptionPath = (type) => {
    if (!matchedSport?.sportId) return `/member/book/${type}/sports`;
    if (type === 'court') return `/member/book/courts/${matchedSport.sportId}`;
    if (type === 'class') return `/member/book/classes/${matchedSport.sportId}`;
    return `/member/book/coaches/${matchedSport.sportId}`;
  };

  return (
    <PageFrame
      title="Đặt Lịch & Đăng Ký Dịch Vụ"
      description="Chọn thuê sân chơi thể thao theo khung giờ hoặc đăng ký lớp huấn luyện cùng HLV chuyên nghiệp."
    >
      {matchedSport && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-semibold text-orange-900 flex flex-wrap items-center justify-between gap-2">
          <span>
            Đang chọn nhanh cho bộ môn: <strong className="font-black">{matchedSport.name}</strong>
          </span>
          <Link to="/member/book" className="text-orange-700 font-bold underline hover:text-orange-900">
            Chọn bộ môn khác
          </Link>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            type: 'court',
            title: 'Thuê Sân Thể Thao',
            description: 'Chọn bộ môn, sân tập tiêu chuẩn và đặt 1 hoặc nhiều khung giờ liên tiếp linh hoạt theo nhu cầu của bạn.',
            icon: 'sports_tennis',
            badge: 'Tự do & Chủ động',
            features: ['Chọn nhiều giờ liên tiếp linh hoạt', 'Sân đạt chuẩn thi đấu', 'Xác nhận tức thì qua hệ thống'],
          },
          {
            type: 'class',
            title: 'Đăng Ký Lớp Học Thể Thao',
            description: 'Tham gia các lớp huấn luyện bài bản từ cơ bản đến nâng cao cùng đội ngũ HLV chứng chỉ quốc tế.',
            icon: 'fitness_center',
            badge: 'Có HLV Hướng dẫn',
            features: ['HLV chuyên nghiệp 1-1 / nhóm', 'Giáo trình chuẩn hoá FPT', 'Theo dõi tiến độ tập luyện'],
          },
          {
            type: 'pt',
            title: 'Thuê HLV Riêng (PT 1-1)',
            description: 'Kèm cặp 1 kèm 1 với Huấn luyện viên chuyên môn cao, cá nhân hóa hoàn toàn lộ trình và thể lực.',
            icon: 'person_add_alt_1',
            badge: 'Kèm riêng 1-1',
            features: ['Lộ trình chuyên biệt cá nhân hóa', 'Đội ngũ HLV chứng chỉ quốc tế', 'Được hoàn 100% nếu hủy trước 2h'],
          },
        ].map((option) => (
          <Link
            key={option.type}
            to={buildOptionPath(option.type)}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-orange-400 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white shadow-sm">
                  <span className="material-symbols-outlined text-3xl">{option.icon}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {option.badge}
                </span>
              </div>
              <h2 className="mt-5 font-headline-sm text-xl font-bold text-slate-900 transition group-hover:text-orange-600">
                {option.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {option.description}
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-500">
                {option.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Bắt đầu lựa chọn
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white group-hover:translate-x-1">
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Bạn đã có lịch đặt trước?</h3>
          <p className="text-xs text-slate-500 mt-0.5">Kiểm tra lại thời gian thi đấu và lớp học đã đăng ký trong thời khóa biểu cá nhân.</p>
        </div>
        <Link
          to="/member/schedule"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          Xem thời khóa biểu của tôi
        </Link>
      </div>
    </PageFrame>
  );
}

function SportPicker({ bookingType }) {
  const navigate = useNavigate();
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    getBookingSports()
      .then((rows) => {
        if (current) setSports(rows);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải danh sách môn thể thao.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const isCourt = bookingType === 'court';
  const isPt = bookingType === 'pt';
  const displayedSports = isCourt
    ? sports.filter((s) => (s.slug || s.code) !== 'gym-fitness' && (s.slug || s.code) !== 'yoga-pilates')
    : sports;
  const getTargetUrl = (sId) => {
    if (isCourt) return `/member/book/courts/${sId}`;
    if (isPt) return `/member/book/coaches/${sId}`;
    return `/member/book/classes/${sId}`;
  };

  return (
    <PageFrame
      title="Chọn Môn Thể Thao"
      description={`Bước 1 trong 3 · ${
        isCourt
          ? 'Chọn bộ môn để xem danh sách sân và khung giờ trống.'
          : isPt
          ? 'Chọn bộ môn để xem danh sách HLV chuyên môn và đặt lịch PT 1-1.'
          : 'Chọn bộ môn để xem các lớp học và thời khóa biểu.'
      }`}
    >
      <ErrorNotice error={error} />
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4">
              <div className="h-44 w-full rounded-2xl bg-slate-100" />
              <div className="mt-4 h-5 w-3/4 rounded bg-slate-100" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : displayedSports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Hiện tại chưa có bộ môn nào đang mở dịch vụ. Vui lòng quay lại sau.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedSports.map((sport) => {
            const media = getSportMedia(sport.slug || sport.code);
            return (
              <button
                key={sport.sportId}
                type="button"
                onClick={() => navigate(getTargetUrl(sport.sportId))}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-xl cursor-pointer"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={media.image}
                    alt={sport.name}
                    className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md">
                      <span className="material-symbols-outlined text-[20px]">{sport.icon || 'sports'}</span>
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      {media.category}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-headline-sm text-lg font-bold text-slate-900 transition group-hover:text-orange-600">
                    {sport.name}
                  </h2>
                  <p className="mt-1 flex-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {sport.subtitle || sport.description || 'Bộ môn thể thao hiện đại tại F Sport Center.'}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs font-bold text-orange-600">
                      {isCourt ? 'Xem sân & giờ trống' : isPt ? 'Xem HLV & đặt lịch PT' : 'Xem lớp & thời khóa biểu'}
                    </span>
                    <span className="text-sm font-bold text-orange-600 transition group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}

function CourtPicker({ sportId }) {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectionHint, setSelectionHint] = useState('');

  useEffect(() => {
    let current = true;
    getAvailableCourtSlots(sportId)
      .then((rows) => {
        if (!current) return;
        setSlots(rows);
        setSelectedDate(rows[0]?.startTime?.slice(0, 10) || '');
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải sân và khung giờ.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [sportId]);

  const dates = useMemo(
    () => [...new Set(slots.map((slot) => slot.startTime.slice(0, 10)))],
    [slots],
  );
  const courts = useMemo(
    () => [...new Set(slots.filter((slot) => slot.startTime.startsWith(selectedDate)).map((slot) => slot.courtId))],
    [slots, selectedDate],
  );

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedCourtId(null);
    setSelectedSlots([]);
    setSelectionHint('');
  };

  const handleSlotClick = (courtId, clickedSlot, courtSlots) => {
    if (clickedSlot.status === 'MAINTENANCE') {
      setSelectionHint('Khung giờ này đang trong thời gian bảo trì, vui lòng chọn khung giờ khác.');
      return;
    }

    setSelectionHint('');
    if (selectedCourtId !== courtId || selectedSlots.length === 0) {
      setSelectedCourtId(courtId);
      setSelectedSlots([clickedSlot]);
      return;
    }

    const existingIdx = selectedSlots.findIndex((s) => s.startTime === clickedSlot.startTime);
    if (existingIdx !== -1) {
      if (selectedSlots.length === 1) {
        setSelectedCourtId(null);
        setSelectedSlots([]);
      } else if (existingIdx === 0) {
        setSelectedSlots(selectedSlots.slice(1));
      } else if (existingIdx === selectedSlots.length - 1) {
        setSelectedSlots(selectedSlots.slice(0, -1));
      } else {
        setSelectedSlots(selectedSlots.slice(0, existingIdx + 1));
      }
      return;
    }

    const clickedIndexInCourt = courtSlots.findIndex((s) => s.startTime === clickedSlot.startTime);
    const firstIndexInCourt = courtSlots.findIndex((s) => s.startTime === selectedSlots[0].startTime);
    const lastIndexInCourt = courtSlots.findIndex(
      (s) => s.startTime === selectedSlots[selectedSlots.length - 1].startTime,
    );

    const minIndex = Math.min(firstIndexInCourt, clickedIndexInCourt);
    const maxIndex = Math.max(lastIndexInCourt, clickedIndexInCourt);
    const candidateRange = courtSlots.slice(minIndex, maxIndex + 1);

    let isConsecutive = true;
    for (let i = 0; i < candidateRange.length - 1; i += 1) {
      const currentEnd = new Date(candidateRange[i].endTime).getTime();
      const nextStart = new Date(candidateRange[i + 1].startTime).getTime();
      if (currentEnd !== nextStart) {
        isConsecutive = false;
        break;
      }
    }

    if (isConsecutive) {
      setSelectedSlots(candidateRange);
    } else {
      setSelectedSlots([clickedSlot]);
      setSelectionHint(
        'Do có khung giờ đã được đặt xen giữa, hệ thống đã chuyển sang bắt đầu chọn từ khung giờ bạn vừa nhấn.',
      );
    }
  };

  const handleProceedToCheckout = () => {
    if (!selectedCourtId || selectedSlots.length === 0) return;
    const firstSlot = selectedSlots[0];
    const lastSlot = selectedSlots[selectedSlots.length - 1];
    const query = new URLSearchParams({
      startTime: firstSlot.startTime,
      endTime: lastSlot.endTime,
    });
    navigate(`/member/book/checkout/court/${selectedCourtId}?${query}`);
  };

  const selectedCourtInfo = selectedSlots[0] || null;
  const totalSelectedHours = selectedSlots.length;
  const totalEstimatedPrice = selectedCourtInfo ? selectedCourtInfo.hourlyRate * totalSelectedHours : 0;

  return (
    <PageFrame
      title="Chọn sân và khung giờ"
      description="Bạn có thể chọn 1 giờ hoặc nhiều giờ liên tiếp trên cùng một sân. Nhấn vào khung giờ đầu và khung giờ cuối để nối nhanh cả dải giờ trống."
    >
      <ErrorNotice error={error} />
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Đang tải sân và giờ trống...</div>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Hiện không có sân hoặc khung giờ trống trong 14 ngày tới.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {dates.map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => handleDateChange(date)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${selectedDate === date ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
              >
                {new Date(`${date}T12:00:00`).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-orange-200/80 bg-orange-50/60 px-4 py-3 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-orange-600">touch_app</span>
              <span>
                <strong>Hướng dẫn:</strong> Nhấn chọn 1 hoặc nhiều ô giờ liên tiếp trên cùng một sân. Nếu chọn 2 ô cách nhau, các giờ trống ở giữa sẽ tự động được nối liền.
              </span>
            </div>
            {selectionHint && (
              <span className="text-orange-700 font-semibold">{selectionHint}</span>
            )}
          </div>

          {/* Cảnh báo nếu toàn bộ sân đang bảo trì */}
          {courts.length > 0 && courts.every((cId) => {
            const cSlots = slots.filter((slot) => slot.courtId === cId && slot.startTime.startsWith(selectedDate));
            return cSlots.length > 0 && cSlots.every((s) => s.status === 'MAINTENANCE');
          }) && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-red-600">construction</span>
              <span>
                Toàn bộ sân / làn bơi của bộ môn này trong ngày đã chọn đang trong thời gian bảo trì kỹ thuật (Tạm ngưng nhận đặt). Quý hội viên vui lòng chọn ngày khác hoặc liên hệ trung tâm.
              </span>
            </div>
          )}

          <div className="space-y-4 pb-24">
            {courts.map((courtId) => {
              const courtSlots = slots.filter((slot) => slot.courtId === courtId && slot.startTime.startsWith(selectedDate));
              const court = courtSlots[0];
              if (!court) return null;
              const isCurrentCourtSelected = selectedCourtId === courtId && selectedSlots.length > 0;
              const isCourtMaintenance = courtSlots.length > 0 && courtSlots.every((s) => s.status === 'MAINTENANCE');

              return (
                <section
                  key={courtId}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                    isCourtMaintenance
                      ? 'border-amber-200 bg-amber-50/20 opacity-90'
                      : isCurrentCourtSelected
                      ? 'border-orange-500 ring-2 ring-orange-500/15'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-slate-900">{court.courtName}</h2>
                        {isCourtMaintenance ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
                            <span className="material-symbols-outlined text-[13px]">construction</span>
                            Đang bảo trì - Tạm ngưng nhận đặt
                          </span>
                        ) : isCurrentCourtSelected ? (
                          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-700">
                            Đã chọn {selectedSlots.length} giờ liên tiếp
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{court.description}</p>
                      {isCourtMaintenance && (
                        <p className="mt-1.5 text-xs text-amber-800 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">info</span>
                          Sân / Làn bơi này đang trong kế hoạch bảo dưỡng định kỳ của trung tâm. Tạm thời không nhận đặt chỗ mới.
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-extrabold text-orange-600">{formatMoney(court.hourlyRate)} / giờ</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {courtSlots.map((slot) => {
                      const isSlotMaintenance = slot.status === 'MAINTENANCE';
                      const isSelected =
                        isCurrentCourtSelected && selectedSlots.some((s) => s.startTime === slot.startTime);
                      const startStr = new Date(slot.startTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const endStr = new Date(slot.endTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      if (isSlotMaintenance) {
                        return (
                          <div
                            key={`${slot.courtId}-${slot.startTime}`}
                            className="rounded-xl border border-dashed border-amber-300 bg-amber-50/70 text-slate-400 px-2.5 py-2 text-xs font-semibold flex flex-col items-center justify-center gap-0.5 cursor-not-allowed select-none"
                            title="Khung giờ này đang bảo trì"
                          >
                            <span className="line-through text-slate-400 text-[11px]">{startStr}</span>
                            <span className="text-[10px] text-amber-800 font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">build</span>Bảo trì
                            </span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={`${slot.courtId}-${slot.startTime}`}
                          type="button"
                          onClick={() => handleSlotClick(courtId, slot, courtSlots)}
                          className={`rounded-xl border px-2.5 py-2.5 text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'border-orange-600 bg-orange-500 text-white shadow-sm shadow-orange-500/30 ring-2 ring-orange-500/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700'
                          }`}
                        >
                          <span>{startStr}</span>
                          <span className={`text-[10px] font-medium ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                            đến {endStr}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {selectedCourtInfo && totalSelectedHours > 0 && (
            <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="font-bold text-orange-400 uppercase tracking-wider">{selectedCourtInfo.courtName}</span>
                    <span>•</span>
                    <span>
                      {new Date(selectedSlots[0].startTime).toLocaleDateString('vi-VN', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-base font-extrabold text-white">
                      {new Date(selectedSlots[0].startTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' – '}
                      {new Date(selectedSlots[selectedSlots.length - 1].endTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="rounded-lg bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-xs font-bold text-orange-300">
                      {totalSelectedHours} giờ liên tiếp
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      Tạm tính: {formatMoney(totalEstimatedPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourtId(null);
                      setSelectedSlots([]);
                      setSelectionHint('');
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/30 transition cursor-pointer"
                  >
                    <span>Tiếp tục thanh toán ({totalSelectedHours} giờ)</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PageFrame>
  );
}

function ClassPicker({ sportId }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    getBookableClasses(sportId)
      .then((rows) => {
        if (current) setClasses(rows);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải lớp học.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [sportId]);

  return (
    <PageFrame title="Chọn lớp học và thời khóa biểu" description="Chọn đúng lớp, ngày học và mức phí trước khi xác nhận thanh toán.">
      <ErrorNotice error={error} />
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Đang tải lớp học từ database...</div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Chưa có lớp sắp diễn ra cho bộ môn này.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((classSession) => {
            const remaining = Math.max(0, classSession.maxSlots - classSession.bookedSlots);
            const alreadyBooked = ['BOOKED', 'CONFIRMED'].includes(classSession.memberBookingStatus);
            return (
              <article key={classSession.sessionId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">{classSession.className}</h2>
                    <p className="mt-1 text-xs text-slate-500">{classSession.coachName || `HLV #${classSession.coachId}`}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                    Còn {remaining}/{classSession.maxSlots} chỗ
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Bắt đầu</dt><dd className="text-right font-semibold text-slate-800">{formatDate(classSession.startTime)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Kết thúc</dt><dd className="text-right font-semibold text-slate-800">{new Date(classSession.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Giá/lớp</dt><dd className="font-extrabold text-orange-600">{formatMoney(classSession.priceAmount)}</dd></div>
                </dl>
                <button
                  type="button"
                  disabled={remaining < 1 || alreadyBooked}
                  onClick={() => navigate(`/member/book/checkout/class/${classSession.sessionId}`)}
                  className="mt-5 w-full rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/20 transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {alreadyBooked ? (classSession.memberBookingStatus === 'BOOKED' ? 'Đang chờ thanh toán' : 'Bạn đã đăng ký lớp này') : remaining < 1 ? 'Lớp đã hết chỗ' : 'Chọn lớp & thanh toán'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}

function CoachPicker({ sportId }) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateStr(new Date()));
  const [coachesList, setCoachesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    getBookingCoaches()
      .then((data) => {
        if (!current) return;
        const rows = Array.isArray(data) ? data : [];
        const filtered = sportId
          ? rows.filter((c) => {
              if (Array.isArray(c.sportIds) && c.sportIds.length > 0) {
                return c.sportIds.some((id) => String(id) === String(sportId));
              }
              return true;
            })
          : rows;
        const mapped = filtered.map((c) => ({
          coachId: c.coachId,
          name: c.fullName,
          title: c.specialty || 'HLV Cá Nhân Chuyên Nghiệp',
          certifications: c.bio || 'Huấn luyện viên chính thức tại F Sport Center',
          hourlyRate: Number(c.hourlyRate) || 250000,
          rating: Number(c.averageRating) || 0,
          reviewCount: Number(c.reviewCount) || 0,
          specialties: c.sportsTaught?.length ? c.sportsTaught : ['Thể lực', 'Kỹ thuật chuyên sâu'],
          availabilityJson: c.availabilityJson || '{}',
          avatar: c.avatar || '',
        }));
        setCoachesList(mapped);
      })
      .catch((requestError) => {
        if (current) {
          setError(requestError.message || 'Không thể tải danh sách huấn luyện viên.');
          setCoachesList([]);
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [sportId]);

  const handleSelectSlot = (coach, timeSlot) => {
    const [hh, mm] = timeSlot.split(':').map(Number);
    const hhPad = String(hh).padStart(2, '0');
    const mmPad = String(mm).padStart(2, '0');
    const startLocal = `${selectedDate}T${hhPad}:${mmPad}:00`;
    const endDateObj = new Date(`${selectedDate}T${hhPad}:${mmPad}:00`);
    endDateObj.setHours(endDateObj.getHours() + 1);
    const endLocal = `${toLocalDateStr(endDateObj)}T${String(endDateObj.getHours()).padStart(2, '0')}:${String(endDateObj.getMinutes()).padStart(2, '0')}:00`;
    const query = new URLSearchParams({
      startTime: startLocal,
      endTime: endLocal,
    });
    navigate(`/member/book/checkout/pt/${coach.coachId}?${query}`);
  };

  return (
    <PageFrame
      title="Chọn Huấn Luyện Viên Cá Nhân (PT 1-1)"
      description="Bước 2 trong 3 · Lựa chọn HLV phù hợp theo bảng giá, chứng chỉ chuyên môn và chọn giờ tập thuận tiện."
    >
      <ErrorNotice error={error} />
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-bold text-slate-600">Chọn ngày tập:</span>
        {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          const dateStr = toLocalDateStr(d);
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                selectedDate === dateStr
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-100" />
              <div className="h-4 w-2/3 rounded bg-slate-100" />
              <div className="h-20 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : coachesList.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Hiện chưa có huấn luyện viên nào phụ trách bộ môn này. Vui lòng chọn bộ môn khác hoặc đăng ký lớp học theo lịch.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coachesList.map((coach) => {
            const candidateSlots = getCoachCandidateSlotsForDate(coach.availabilityJson, selectedDate);
            return (
              <div key={coach.coachId} className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                <div>
                  <div className="flex items-center gap-4">
                    {coach.avatar ? (
                      <img
                        src={coach.avatar}
                        alt={coach.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 text-orange-400 font-black flex items-center justify-center text-lg border border-slate-200">
                        {(coach.name || 'HLV').split(/\s+/).map((p) => p[0]).slice(-2).join('').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{coach.name}</h3>
                      <p className="text-xs text-orange-600 font-semibold">{coach.title}</p>
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 mt-1 font-bold">
                        <span className="material-symbols-outlined text-[14px]">star</span>
                        {coach.reviewCount > 0 ? (
                          <>
                            <span>{coach.rating.toFixed(1)}</span>
                            <span className="text-slate-400 font-normal">({coach.reviewCount} đánh giá)</span>
                          </>
                        ) : (
                          <span className="text-slate-400 font-normal">Chưa có đánh giá</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 text-xs space-y-1.5">
                    <div className="text-slate-500">
                      <span className="font-semibold text-slate-700">Giới thiệu:</span> {coach.certifications}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {coach.specialties.map((spec, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-orange-100/70 text-orange-800 text-[10px] font-semibold">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs text-slate-500">Mức phí niêm yết:</span>
                    <span className="text-base font-extrabold text-orange-600">{formatMoney(coach.hourlyRate)} / buổi</span>
                  </div>

                  <div className="mt-4">
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Khung giờ dự kiến {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('vi-VN')}:
                    </span>
                    {candidateSlots.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">HLV không mở ca rảnh trong ngày đã chọn.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {candidateSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleSelectSlot(coach, slot)}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition text-center cursor-pointer"
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}

function CheckoutPage({ bookingType, itemId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useApp();
  const searchParams = new URLSearchParams(location.search);
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMode, setPaymentMode] = useState('RETAIL'); // 'QUOTA' | 'RETAIL'
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // QR Payment State

  // Member Quota State - fetch from API
  const [memberQuota, setMemberQuota] = useState({
    packageName: 'Đang tải...',
    initialQuota: 0,
    usedQuota: 0,
    heldQuota: 0,
    remainingQuota: 0,
    canUseForBooking: false,
    // Court quota fields
    initialQuotaCourts: 0,
    usedQuotaCourts: 0,
    heldQuotaCourts: 0,
    remainingQuotaCourts: 0,
    canUseCourtQuota: false,
  });

  // Fetch member quota from API
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const hours = startTime && endTime ? Math.max(1, Math.ceil((new Date(endTime) - new Date(startTime)) / 3600000)) : 1;
        const data = await apiRequest(`/members/me/quota?bookingType=${encodeURIComponent(bookingType.toUpperCase())}&itemId=${encodeURIComponent(itemId)}&requiredHours=${hours}`);
        setMemberQuota({
          packageName: data.packageName || 'Chưa có gói tập',
          initialQuota: data.initialQuota || 0,
          usedQuota: data.usedQuota || 0,
          heldQuota: data.heldQuota || 0,
          remainingQuota: data.remainingQuota || 0,
          canUseForBooking: data.canUseForBooking || false,
          // Court quota fields
          initialQuotaCourts: data.initialQuotaCourts || 0,
          usedQuotaCourts: data.usedQuotaCourts || 0,
          heldQuotaCourts: data.heldQuotaCourts || 0,
          remainingQuotaCourts: data.remainingQuotaCourts || 0,
          canUseCourtQuota: data.canUseCourtQuota || false,
        });
      } catch {
        setMemberQuota({
          packageName: 'Chưa có gói tập',
          initialQuota: 0,
          usedQuota: 0,
          heldQuota: 0,
          remainingQuota: 0,
          canUseForBooking: false,
          // Court quota fields
          initialQuotaCourts: 0,
          usedQuotaCourts: 0,
          heldQuotaCourts: 0,
          remainingQuotaCourts: 0,
          canUseCourtQuota: false,
        });
      }
    };

    fetchQuota();
  }, [bookingType, itemId, startTime, endTime]);

  // Voucher Code State
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  useEffect(() => {
    let current = true;
    getBookingQuote(bookingType.toUpperCase(), itemId, startTime, endTime)
      .then((result) => {
        if (current) setQuote(result);
      })
      .catch((requestError) => {
        if (current) {
          setError(requestError.message || 'Không thể xác nhận giá và lịch booking.');
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [bookingType, endTime, itemId, startTime]);

  // Handle Voucher Application (MGR-18)
  const applyVoucher = async () => {
    setVoucherError('');
    if (!voucherCode.trim()) return;

    const code = voucherCode.trim().toUpperCase();
    try {
      const res = await apiRequest('/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({ code, amount: Math.max(0, originalPrice - systemDiscount), appliesTo: 'BOOKING_ONLY' }),
      });
      if (res && res.valid && res.voucher) {
        setAppliedVoucher({ ...res.voucher, calculatedDiscount: res.discountAmount });
      } else {
        setVoucherError(res?.message || 'Mã ưu đãi không hợp lệ.');
      }
    } catch (err) {
      setVoucherError(err.message || 'Không thể xác thực mã ưu đãi từ hệ thống.');
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  // Price & duration calculations
  const bookedHours = useMemo(() => {
    const startVal = quote?.startTime || startTime;
    const endVal = quote?.endTime || endTime;
    if ((quote?.bookingType || bookingType)?.toUpperCase() !== 'COURT' || !startVal || !endVal) {
      return 1;
    }
    const diffHours = Math.round((new Date(endVal).getTime() - new Date(startVal).getTime()) / 3600000);
    return Math.max(1, diffHours);
  }, [bookingType, endTime, quote?.bookingType, quote?.endTime, quote?.startTime, startTime]);

  const isCourtBooking = (quote?.bookingType || bookingType)?.toUpperCase() === 'COURT';
  const requiredQuota = isCourtBooking ? bookedHours : 1;
  const quotaUnit = isCourtBooking ? 'giờ' : 'buổi';
  const quotaUnitTitle = isCourtBooking ? 'Giờ' : 'Buổi';
  const quotaScopeLabel = isCourtBooking ? 'Giờ Sân' : 'Buổi Tập';
  const remainingQuotaBalance = isCourtBooking ? memberQuota.remainingQuotaCourts : memberQuota.remainingQuota;
  const initialQuotaBalance = isCourtBooking ? memberQuota.initialQuotaCourts : memberQuota.initialQuota;
  const insufficientQuotaMessage = `Số ${isCourtBooking ? 'giờ sân' : 'buổi tập'} trong gói hội viên của bạn không đủ (cần ${requiredQuota} ${quotaUnit}${isCourtBooking ? ` cho ${bookedHours} giờ đặt sân` : ''}, hiện còn ${remainingQuotaBalance} ${quotaUnit}). Vui lòng thanh toán theo giá bán lẻ hoặc nạp thêm gói tập. Quy chế trung tâm nghiêm cấm tách một phần quota và bù tiền mặt.`;

  const originalPrice = quote?.originalAmount ?? quote?.amount ?? 0;
  const systemDiscount = quote?.discountAmount ?? 0;

  const voucherDiscount = paymentMode === 'RETAIL' ? Number(appliedVoucher?.calculatedDiscount || 0) : 0;

  const finalRetailPrice = Math.max(0, originalPrice - systemDiscount - voucherDiscount);
  const finalPrice = paymentMode === 'QUOTA' ? 0 : finalRetailPrice;

  const handleCheckout = async () => {
    setSubmitting(true);
    setError('');

    // Business rule: Quota validation
    if (paymentMode === 'QUOTA') {
      if (remainingQuotaBalance < requiredQuota) {
        setError(insufficientQuotaMessage);
        setSubmitting(false);
        return;
      }

      // Xử lý thanh toán bằng quota - Backend tính toán và trừ quota
      try {
        const confirmation = await checkoutBooking(
          bookingType.toUpperCase(),
          itemId,
          startTime,
          endTime,
          'MEMBERSHIP_QUOTA',
          true  // useQuota = true
        );

        // Backend đã trả về quotaMessage, không tự tạo
        showToast(
          'Đặt lịch thành công!',
          confirmation?.quotaMessage || 'Lịch đặt chỗ bằng quota đã được xác nhận.',
          'success'
        );
        window.dispatchEvent(new Event('sporthub:notifications-updated'));
        navigate('/member/book/confirmation', { replace: true, state: { confirmation } });
      } catch (requestError) {
        setError(requestError.message || 'Không thể đặt chỗ bằng quota.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Xử lý thanh toán retail (có phí)
    try {
      const confirmation = await checkoutBooking(
        bookingType.toUpperCase(),
        itemId,
        startTime,
        endTime,
        paymentMethod,
        false,
        appliedVoucher?.code ?? null
      );

      // Redirect to VNPay payment page
      if (paymentMethod === 'VNPAY' && confirmation.paymentStatus !== 'PAID') {
        try {
          const vnpayResult = await generatePayment(confirmation.paymentId, 'VNPAY');

          redirectToPayment(confirmation.paymentId, vnpayResult.paymentUrl);
          return;
        } catch (vnpayError) {
          console.error('[VNPAY] Exception:', vnpayError);
          setError(vnpayError.message || 'Không thể chuyển đến trang thanh toán VNPay. Vui lòng thử lại.');
          setSubmitting(false);
          return;
        }
      }

      // Các phương thức khác (CASH_COUNTER) → Navigate trực tiếp
      navigate('/member/book/confirmation', { replace: true, state: { confirmation } });

    } catch (requestError) {
      setError(requestError.message || 'Thanh toán booking thất bại.');
      setSubmitting(false);
    }
  };

  const actionBtnLabel = submitting
    ? 'Đang xử lý...'
    : paymentMode === 'QUOTA'
    ? `Xác Nhận Đặt Chỗ — Trừ ${requiredQuota} ${quotaScopeLabel} (Còn: ${remainingQuotaBalance - requiredQuota} ${quotaUnit})`
    : paymentMethod === 'CASH_COUNTER'
    ? `Giữ Chỗ (Thanh Toán Tại Quầy) — ${formatMoney(finalPrice)}`
    : paymentMethod === 'VNPAY'
    ? `Thanh Toán Qua VNPAY — ${formatMoney(finalPrice)}`
    : `Xác Nhận & Thanh Toán ${formatMoney(finalPrice)}`;

  return (
    <PageFrame
      title="Xác nhận booking & thanh toán"
      description={`Lựa chọn khấu trừ ${isCourtBooking ? 'số giờ sân' : 'số buổi'} từ gói hội viên hoặc thanh toán theo giá niêm yết bán lẻ.`}
    >
      <ErrorNotice error={error} />
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Đang xác nhận giá và lịch...
        </div>
      ) : quote ? (
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-orange-600">
              {quote.bookingType === 'COURT'
                ? 'Thuê sân chơi thể thao'
                : quote.bookingType === 'PT'
                ? 'Huấn luyện viên cá nhân 1-1'
                : 'Đăng ký lớp học'}
            </div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{quote.itemName}</h2>
            <p className="mt-1 text-sm text-slate-500">{quote.sportName}</p>
          </div>

          <dl className="space-y-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Thời gian</dt>
              <dd className="text-right font-semibold text-slate-800">
                <span>
                  {formatDate(quote.startTime)}
                  {quote.endTime
                    ? ` — ${new Date(quote.endTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : ''}
                </span>
                {quote.bookingType === 'COURT' && (
                  <span className="ml-2 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                    {bookedHours} giờ liên tiếp
                  </span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Địa điểm / HLV</dt>
              <dd className="text-right font-semibold text-slate-800">{quote.location}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Môn thể thao</dt>
              <dd className="text-right font-semibold text-slate-800">{quote.sportName}</dd>
            </div>

            <div className="flex justify-between gap-4 border-t border-slate-200/60 pt-3">
              <dt className="text-slate-500">
                Giá niêm yết bán lẻ{quote.bookingType === 'COURT' && bookedHours > 1 ? ` (${bookedHours} giờ)` : ''}
              </dt>
              <dd className={`font-semibold ${paymentMode === 'QUOTA' || systemDiscount > 0 ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {formatMoney(originalPrice)}
              </dd>
            </div>

            {paymentMode === 'QUOTA' && (
              <div className="flex justify-between items-center rounded-lg bg-orange-100/70 px-3 py-1.5 text-xs text-orange-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-orange-600">verified</span>
                  Khấu trừ Quota Gói Hội Viên ({memberQuota.packageName}):
                </span>
                <strong className="font-bold text-orange-700">Trừ {requiredQuota} {quotaUnitTitle} (0đ)</strong>
              </div>
            )}

            {paymentMode === 'RETAIL' && voucherDiscount > 0 && (
              <div className="flex justify-between items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="material-symbols-outlined text-sm text-emerald-600">sell</span>
                  Voucher ưu đãi ({appliedVoucher.code}):
                </span>
                <strong className="font-bold text-emerald-700">-{formatMoney(voucherDiscount)}</strong>
              </div>
            )}

            <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
              <dt className="font-bold text-slate-800">Tổng thanh toán</dt>
              <dd className="text-xl font-extrabold text-orange-600">{formatMoney(finalPrice)}</dd>
            </div>
          </dl>

          {/* QUOTA VS RETAIL SELECTOR */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Phương Thức Quyết Toán (Quota Gói vs Bán Lẻ)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Use Quota */}
              <button
                type="button"
                onClick={() => {
                  if (remainingQuotaBalance < requiredQuota) {
                    setError(insufficientQuotaMessage);
                    return;
                  }
                  setError('');
                  setPaymentMode('QUOTA');
                }}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  paymentMode === 'QUOTA'
                    ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                } ${remainingQuotaBalance < requiredQuota ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-orange-600">card_membership</span>
                      Dùng {quotaScopeLabel} Gói Hội Viên ({requiredQuota} {quotaUnit})
                    </span>
                    {paymentMode === 'QUOTA' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{memberQuota.packageName}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Số dư khả dụng:</span>
                  <span className={`font-extrabold ${remainingQuotaBalance >= requiredQuota ? 'text-emerald-600' : 'text-red-500'}`}>
                    {remainingQuotaBalance} / {initialQuotaBalance} {quotaUnit}
                  </span>
                </div>
              </button>

              {/* Option 2: Retail Cash / QR */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('RETAIL');
                  setError('');
                }}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  paymentMode === 'RETAIL'
                    ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-blue-600">payments</span>
                      Thanh Toán Giá Bán Lẻ
                    </span>
                    {paymentMode === 'RETAIL' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Thanh toán VNPay hoặc tiền mặt quầy</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Cần thanh toán:</span>
                  <span className="font-extrabold text-orange-600">{formatMoney(finalRetailPrice)}</span>
                </div>
              </button>
            </div>
          </div>

          {/* VOUCHER INPUT BOX (Only applicable for RETAIL payment) */}
          {paymentMode === 'RETAIL' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-orange-500">confirmation_number</span>
                Mã Giảm Giá / Voucher
              </label>

              {appliedVoucher ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono font-bold text-[11px]">
                      {appliedVoucher.code}
                    </span>
                    <span className="text-emerald-800 font-semibold">
                      {appliedVoucher.discountType === 'PERCENT'
                        ? `Giảm ${appliedVoucher.discountValue}%`
                        : appliedVoucher.discountType === 'FIXED'
                        ? `Giảm ${formatMoney(appliedVoucher.discountValue)}`
                        : 'Tặng 30 ngày gia hạn'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeVoucher}
                    className="text-xs text-red-500 hover:text-red-700 font-bold"
                  >
                    Hủy bỏ
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã (ví dụ: WELCOME20, SUMMER50K)"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase tracking-wider bg-white focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={applyVoucher}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    Áp Dụng
                  </button>
                </div>
              )}
              {voucherError && <p className="text-[11px] text-red-600 font-medium">{voucherError}</p>}
            </div>
          )}

          {/* Payment Method Selector (Only for Retail mode) */}
          {paymentMode === 'RETAIL' && (
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onChange={setPaymentMethod}
            />
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={handleCheckout}
            className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-orange-500/25 transition disabled:cursor-wait disabled:opacity-60 cursor-pointer"
          >
            {actionBtnLabel}
          </button>
        </div>
      ) : null}

    </PageFrame>
  );
}

function BookingConfirmationPage() {
  const location = useLocation();
  const confirmation = location.state?.confirmation;
  if (!confirmation) {
    return (
      <PageFrame title="Không có thông tin xác nhận" description="Hãy xem lịch booking hoặc bắt đầu một booking mới.">
        <Link to="/member/book" className="inline-flex rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition">Bắt đầu booking</Link>
      </PageFrame>
    );
  }
  return (
    <PageFrame title={confirmation.paymentStatus === 'PAID' ? 'Booking đã xác nhận' : 'Booking chờ thanh toán'} description={confirmation.paymentStatus === 'PAID' ? 'Giao dịch và lịch hẹn đã được xác nhận.' : 'Chỗ được giữ tối đa 10 phút. Lịch chỉ được xác nhận sau khi lễ tân thu tiền hoặc ngân hàng xác nhận thanh toán.'}>
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          {confirmation.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'} · {confirmation.referenceCode}
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{confirmation.itemName}</h2>
        <p className="text-sm text-slate-500">{confirmation.sportName} · {confirmation.location}</p>
        <p className="text-sm font-semibold text-slate-800">
          {formatDate(confirmation.startTime)} — {new Date(confirmation.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </p>

        {confirmation.quotaMessage && (
          <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-600 text-[18px]">card_membership</span>
            <span>{confirmation.quotaMessage}</span>
          </div>
        )}

        <p className="text-2xl font-extrabold text-orange-600">{formatMoney(confirmation.amountPaid)}</p>
        <div className="mt-6 flex flex-wrap gap-3 pt-3 border-t border-slate-100">
          <Link to="/member/schedule" className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition">Xem trong thời khóa biểu</Link>
          <Link to="/member/book" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition">Đặt dịch vụ khác</Link>
        </div>
      </div>
    </PageFrame>
  );
}

export default function MemberBookingFlowPage() {
  const { bookingType, sportId, resourceId } = useParams();
  const path = useLocation().pathname;

  if (path.endsWith('/confirmation')) return <BookingConfirmationPage />;
  if (path.includes('/checkout/')) return <CheckoutPage bookingType={bookingType} itemId={resourceId} />;
  if (path.endsWith('/sports')) return <SportPicker bookingType={bookingType} />;
  if (path.includes('/courts/')) return <CourtPicker sportId={sportId} />;
  if (path.includes('/classes/')) return <ClassPicker sportId={sportId} />;
  if (path.includes('/coaches/')) return <CoachPicker sportId={sportId} />;
  return <BookingHome />;
}
