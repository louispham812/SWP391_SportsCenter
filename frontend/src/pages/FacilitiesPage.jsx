import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const FACILITIES_DATA = [
  {
    id: 1,
    name: 'Phòng Xông Hơi Băng Tuyết & Sauna Đá Muối',
    category: 'phuc-hoi',
    categoryName: 'Phục Hồi & Thư Giãn',
    tag: 'Miễn phí cho Hội viên',
    icon: 'spa',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    description: 'Liệu pháp xông hơi Sauna kết hợp phòng xông tuyết âm 5°C giúp đào thải độc tố, giảm mỏi cơ tức thì và tái tạo năng lượng sau giờ tập nặng.',
  },
  {
    id: 2,
    name: 'Thẻ AI FaceID & Smart Locker Cảm Ứng',
    category: 'cong-nghe',
    categoryName: 'Công Nghệ 4.0',
    tag: 'Công Nghệ FPT 4.0',
    icon: 'fingerprint',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    description: 'Tự động mở cửa bằng nhận diện khuôn mặt, đặt lịch sân bãi linh hoạt và quản lý tủ đồ cá nhân an toàn tuyệt đối qua ứng dụng di động.',
  },
  {
    id: 3,
    name: 'Healthy Bar & Protein Shake Lounge',
    category: 'tien-nghi',
    categoryName: 'Tiện Nghi & Chill',
    tag: 'Nạp Năng Lượng 100%',
    icon: 'local_cafe',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    description: 'Phục vụ menu Protein Shake cá nhân hóa theo chỉ số InBody, nước ép trái cây nguyên chất detox và không gian làm việc/thư giãn lý tưởng.',
  },
  {
    id: 4,
    name: 'Phòng Biomechanics Lab & InBody 770 Test',
    category: 'y-te',
    categoryName: 'Y Tế & Thể Chất',
    tag: 'Phân Tích Chỉ Số AI',
    icon: 'monitor_weight',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
    description: 'Trang bị máy InBody 770 thế hệ mới đo tỷ lệ cơ - mỡ - xương chính xác 99%, kết hợp camera 120 FPS phân tích dáng chạy và chuyển động.',
  },
  {
    id: 5,
    name: 'Phòng VIP Lounge & Simulator Golf 3D Trackman',
    category: 'tien-nghi',
    categoryName: 'Tiện Nghi & Chill',
    tag: 'Đẳng Cấp 5★',
    icon: 'golf_course',
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=600&q=80',
    description: 'Không gian tiếp khách sang trọng tích hợp phòng tập Golf 3D công nghệ cảm biến Trackman 4 mô phỏng 200+ sân Golf hàng đầu thế giới.',
  },
  {
    id: 6,
    name: 'Trạm Y Tế Sơ Cứu & Phục Hồi Chấn Thương 24/7',
    category: 'y-te',
    categoryName: 'Y Tế & Thể Chất',
    tag: 'Túc Trực 24/7',
    icon: 'medical_services',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
    description: 'Đội ngũ y tế túc trực thường trực với đầy đủ thiết bị sơ cứu chấn thương, băng bó cơ kinesiology tape và giường chườm đá vật lý trị liệu.',
  },
  {
    id: 7,
    name: 'Khu Vực Phòng Tắm & Trang Điểm Premium',
    category: 'tien-nghi',
    categoryName: 'Tiện Nghi & Chill',
    tag: 'Đầy Đủ Dụng Cụ Cá Nhân',
    icon: 'shower',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    description: 'Hệ thống vòi sen nước nóng lạnh tăng áp, cung cấp sẵn khăn tắm vô trùng, dầu gội sữa tắm thảo dược, máy sấy tóc Dyson và gương LED.',
  },
  {
    id: 8,
    name: 'Bãi Đỗ Xe Thông Minh & Trạm Sạc Xe Điện EV',
    category: 'cong-nghe',
    categoryName: 'Công Nghệ 4.0',
    tag: 'An Toàn & Trực Quan',
    icon: 'ev_station',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80',
    description: 'Sức chứa hơn 2.000 xe máy và 300 ô tô với camera quan sát 360°, trang bị 20 trụ sạc nhanh xe điện VinFast / EV chuẩn quốc tế.',
  },
];

export default function FacilitiesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'Tất Cả Tiện Ích' },
    { id: 'phuc-hoi', label: 'Phục Hồi & Thư Giãn' },
    { id: 'cong-nghe', label: 'Công Nghệ 4.0' },
    { id: 'tien-nghi', label: 'Tiện Nghi & Chill' },
    { id: 'y-te', label: 'Y Tế & Thể Chất' },
  ];

  const filteredFacilities = FACILITIES_DATA.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs uppercase font-extrabold text-slate-500 hover:text-orange-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Trang chủ</span>
            </Link>
          </div>

          {/* Header Title & Description */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-[11px] font-extrabold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span>DỊCH VỤ & TIỆN ÍCH HÀNG ĐẦU</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 uppercase tracking-tight">
              Hệ Thống Tiện Ích Đẳng Cấp 5★
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl font-medium">
              Khám phá không gian tiện nghi hiện đại tích hợp công nghệ FPT 4.0, phục vụ trọn vẹn nhu cầu luyện tập, phục hồi và thư giãn của hội viên.
            </p>
          </div>

          {/* Search & Category Tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  type="button"
                  className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold shrink-0 transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tiện ích (Sauna, InBody, Bar...)"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Facilities Cards Grid */}
          {filteredFacilities.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 my-8">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">
                search_off
              </span>
              <p className="text-sm text-slate-600 font-bold mb-1">
                Không tìm thấy tiện ích phù hợp
              </p>
              <p className="text-xs text-slate-400">
                Vui lòng thử lại với từ khóa tìm kiếm hoặc chọn danh mục khác.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFacilities.map((facility) => (
                <article
                  key={facility.id}
                  className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:border-orange-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Facility Image */}
                    <div className="w-full h-44 rounded-xl overflow-hidden mb-4 bg-slate-100 relative">
                      <img
                        src={facility.image}
                        alt={facility.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] uppercase font-extrabold tracking-wider">
                        {facility.tag}
                      </span>
                    </div>

                    {/* Title & Icon Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                        <span className="material-symbols-outlined text-[24px]">
                          {facility.icon}
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors leading-snug">
                        {facility.name}
                      </h2>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-600 font-medium mb-4">
                      {facility.description}
                    </p>
                  </div>

                  {/* Bottom Strip */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">
                      {facility.categoryName}
                    </span>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-orange-600 group-hover:translate-x-1 transition-transform"
                    >
                      <span>Trải nghiệm</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}