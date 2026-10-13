import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useApp } from '../../context/AppContext';

const formatVND = (amount) => (amount || 0).toLocaleString('vi-VN') + ' ₫';

// DANH MỤC 30 BỘ MÔN THỂ THAO 
const FULL_30_SPORTS_CATALOG = [
  {
    id: 'sp_01',
    name: 'Cụm Bơi Lội Olympic 50m',
    category: 'Dưới Nước',
    tag: 'Chuẩn Olympic',
    icon: 'pool',
    image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=600&q=80',
    desc: 'Hệ thống lọc nước điện phân muối không cay mắt, 10 làn bơi tiêu chuẩn cùng khu vực nhảy cầu.',
    classes: [
      { id: 'c_01_1', title: 'Bơi Sải Sức Bền & Kiểm Soát Nhịp Thở', shiftTime: '06:30 - 08:00 (Thứ 2, 4, 6)', coachName: 'HLV Nguyễn Đức Duy', room: 'Bể Bơi Olympic Làn 3-5', maxSlots: 20, bookedSlots: 14, originalPrice: 300000, memberPrice: 0 },
      { id: 'c_01_2', title: 'Luyện Bơi Ếch Kỹ Thuật Nâng Cao', shiftTime: '17:30 - 19:00 (Thứ 3, 5, 7)', coachName: 'HLV Trần Minh Hoàng', room: 'Bể Bơi Olympic Làn 1-2', maxSlots: 15, bookedSlots: 15, originalPrice: 300000, memberPrice: 0 },
    ],
  },
  {
    id: 'sp_02',
    name: 'Pickleball Pro Clinic',
    category: 'Môn Vợt & Bóng',
    tag: 'HOT Trend',
    icon: 'sports_tennis',
    image: 'https://file.hstatic.net/200000060906/file/1_5ca9494b606042c3b792dd5b0080db4e.jpeg',
    desc: 'Cụm sân chuẩn USAPA, mặt sân Plexipave chống lóa cùng hệ thống đèn LED 500 Lux.',
    classes: [
      { id: 'c_02_1', title: 'Pickleball Chiến Thuật Nâng Cao', shiftTime: '18:00 - 19:30 (Thứ 2, 4, 6)', coachName: 'HLV Lê Anh Tuấn', room: 'Sân Mái Che Pro 01', maxSlots: 15, bookedSlots: 12, originalPrice: 450000, memberPrice: 0 },
      { id: 'c_02_2', title: 'Pickleball Căn Bản & Footwork', shiftTime: '08:00 - 09:30 (Thứ 3, 5, 7)', coachName: 'HLV Phạm Hoàng Nam', room: 'Sân Outdoor 03', maxSlots: 12, bookedSlots: 12, originalPrice: 350000, memberPrice: 0 },
    ],
  },
  {
    id: 'sp_03',
    name: 'Tennis ITF High-Performance',
    category: 'Môn Vợt & Bóng',
    tag: 'Chuẩn ITF',
    icon: 'sports_baseball',
    image: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=600&q=80',
    desc: 'Trang bị AI Camera đo tốc độ phát bóng và xoáy bóng, mặt sân cứng tiêu chuẩn.',
    classes: [
      { id: 'c_03_1', title: 'Tennis Chỉnh Đòn Forehand & Backhand', shiftTime: '19:30 - 21:00 (Thứ 3, 5)', coachName: 'HLV Trần Đình Long', room: 'Sân Tennis Central 02', maxSlots: 8, bookedSlots: 5, originalPrice: 800000, memberPrice: 200000 },
    ],
  },
  {
    id: 'sp_04',
    name: 'Gym & Crossfit Center',
    category: 'Gym & Fitness',
    tag: 'Tối tân 5★',
    icon: 'fitness_center',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    desc: 'Trang thiết bị TechnoGym & Hammer Strength 100%, khu vực Powerlifting chuyên sâu.',
    classes: [
      { id: 'c_04_1', title: 'Lớp Tăng Cơ Giảm Mỡ Cường Độ Cao', shiftTime: '17:00 - 18:30 (Mỗi ngày)', coachName: 'HLV Đặng Huy Hoàng', room: 'Gym Zone A', maxSlots: 25, bookedSlots: 18, originalPrice: 250000, memberPrice: 0 },
    ],
  },
  {
    id: 'sp_05',
    name: 'Studio Yoga & Pilates Reformer',
    category: 'Yoga & Pilates',
    tag: 'Trị Liệu Cột Sống',
    icon: 'self_improvement',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
    desc: 'Phòng tập cách âm cao cấp với máy Allegro 2 Reformer nhập khẩu Đức.',
    classes: [
      { id: 'c_05_1', title: 'Yoga Phục Hồi & Trị Liệu Cột Sống', shiftTime: '17:30 - 18:30 (Thứ 4, 7)', coachName: 'HLV Vũ Thu Hà', room: 'Studio Yoga 02', maxSlots: 15, bookedSlots: 11, originalPrice: 400000, memberPrice: 0 },
    ],
  },
];

export default function MemberClassBookingPage() {
  const navigate = useNavigate();
  const { addOrder, showToast } = useApp();

  const [expandedSportId, setExpandedSportId] = useState('sp_02');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const tabsContainerRef = useRef(null);

  const scrollTabs = (direction) => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const categories = [
    { id: 'All', label: 'Tất Cả Bộ Môn' },
    { id: 'Môn Vợt & Bóng', label: 'Môn Vợt & Bóng' },
    { id: 'Dưới Nước', label: 'Dưới Nước' },
    { id: 'Gym & Fitness', label: 'Gym & Fitness' },
    { id: 'Yoga & Pilates', label: 'Yoga & Pilates' },
  ];

  const filteredSports = useMemo(() => {
    return FULL_30_SPORTS_CATALOG.filter((sport) => {
      const matchesCategory = selectedCategory === 'All' || sport.category === selectedCategory;
      const matchesSearch =
        sport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sport.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Khởi tạo & Lưu đơn thực tế vào AppContext -> Chuyển sang Checkout
  const handleProceedToCheckout = (sport, cls) => {
    const now = new Date();
    const createdDateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newOrder = {
      id: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
      sportName: sport.name,
      className: cls.title,
      shiftTime: cls.shiftTime,
      coachName: cls.coachName,
      room: cls.room,
      createdDate: createdDateStr,
      originalPrice: cls.originalPrice,
      finalPrice: cls.memberPrice,
      paymentMethod: 'Chưa thanh toán',
      status: 'PENDING', // Đơn chưa thanh toán
      hoursLeftToClass: 48,
      discountReason: cls.memberPrice === 0 ? 'Đặc quyền Member Pass (-100%)' : 'Ưu đãi Hội viên (-75%)',
    };

    // Gọi hàm lưu đơn vào Global State
    if (addOrder) {
      addOrder(newOrder);
    }

    showToast?.('Khởi tạo đơn thành công', 'Đã lưu đơn đăng ký. Chuyển sang trang thanh toán...', 'info');
    navigate('/member/checkout', { state: { order: newOrder } });
  };

  return (
    <MemberLayout>
      <div className="space-y-6 font-body-md text-slate-800 antialiased">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
              SPORTS CLASS REGISTRATION
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase mt-1">
              Đăng Ký Lớp Học Thể Thao
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Khám phá các bộ môn, chọn lịch ca tập phù hợp và tiến hành đăng ký giữ chỗ.
            </p>
          </div>

          <div className="relative min-w-[260px]">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm môn (Pickleball, Bơi, Gym...)"
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Thanh Tab Thể Loại */}
        <div className="relative flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center text-slate-600 shrink-0 transition-colors cursor-pointer mr-1"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <div
            ref={tabsContainerRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-none scroll-smooth flex-1 py-1 px-1"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center text-slate-600 shrink-0 transition-colors cursor-pointer ml-1"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>

        {/* Danh Sách Bộ Môn */}
        <div className="space-y-4">
          {filteredSports.map((sport) => {
            const isExpanded = expandedSportId === sport.id;

            return (
              <div
                key={sport.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden shadow-sm ${
                  isExpanded ? 'border-orange-500 ring-2 ring-orange-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <img
                      src={sport.image}
                      alt={sport.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {sport.category}
                        </span>
                        <span className="text-[10px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded-full">
                          {sport.tag}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">{sport.name}</h2>
                      <p className="text-xs text-slate-500 font-medium max-w-xl line-clamp-2">{sport.desc}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedSportId(isExpanded ? null : sport.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                      isExpanded
                        ? 'bg-slate-900 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                    }`}
                  >
                    <span>{isExpanded ? 'Thu gọn ca tập' : 'Xem lịch & Đăng ký ngay'}</span>
                    <span className="material-symbols-outlined text-[18px]">
                      {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                    </span>
                  </button>
                </div>

                {/* BẢNG CHỌN CA TẬP */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-5 space-y-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-orange-500 text-[18px]">event_available</span>
                      <span>Lịch các ca tập hiện có môn {sport.name}</span>
                    </h3>

                    <div className="space-y-2.5">
                      {sport.classes.map((cls) => {
                        const availableSlots = cls.maxSlots - cls.bookedSlots;
                        const isFull = availableSlots <= 0;

                        return (
                          <div
                            key={cls.id}
                            className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs hover:border-slate-300 transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{cls.title}</h4>
                                {isFull ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-700">
                                    Hết chỗ
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                    Còn {availableSlots}/{cls.maxSlots} slot
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                                <span>Ca tập: <strong className="text-slate-900 font-bold">{cls.shiftTime}</strong></span>
                                <span>•</span>
                                <span>HLV: <strong className="text-slate-900 font-bold">{cls.coachName}</strong></span>
                                <span>•</span>
                                <span>Địa điểm: <strong className="text-slate-900 font-bold">{cls.room}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                              <div className="text-left md:text-right">
                                <div className="text-[10px] text-slate-400 line-through font-mono">
                                  {formatVND(cls.originalPrice)}
                                </div>
                                <div className="text-sm font-black text-orange-600 font-mono">
                                  {cls.memberPrice === 0 ? '0 ₫ (Miễn phí VIP)' : formatVND(cls.memberPrice)}
                                </div>
                              </div>

                              {isFull ? (
                                <button
                                  type="button"
                                  disabled
                                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs uppercase cursor-not-allowed"
                                >
                                  Lớp Đã Full
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleProceedToCheckout(sport, cls)}
                                  className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer transition-all flex items-center gap-1.5"
                                >
                                  <span>Đăng Ký Ca Này</span>
                                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </MemberLayout>
  );
}