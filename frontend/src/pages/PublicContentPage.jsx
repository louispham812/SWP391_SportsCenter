import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { getPublicFacilities, getPublicSports } from '../services/publicContentApi';
import { getSportMedia, getFacilityMedia } from '../utils/mediaMap';

export default function PublicContentPage({ contentType }) {
  const { slug } = useParams();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const isSports = contentType === 'sports';
  const title = isSports ? 'Khám Phá Các Bộ Môn Thể Thao' : 'Hệ Thống Tiện Ích & Cơ Sở Vật Chất';
  const description = isSports
    ? 'Tổ hợp các bộ môn rèn luyện thể lực, nâng cao kỹ năng và thi đấu đạt chuẩn quốc tế tại F Sport Center.'
    : 'Khám phá không gian luyện tập, hệ thống sân bãi hiện đại và các tiện ích công nghệ số chuẩn 5 sao.';
  const basePath = isSports ? '/sports' : '/facilities';

  const loadData = () => {
    setIsLoading(true);
    setError('');
    const fetcher = isSports ? getPublicSports : getPublicFacilities;

    fetcher()
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Lỗi khi tải dữ liệu từ máy chủ:', err);
        setError('Không thể kết nối đến máy chủ backend để tải dữ liệu. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.');
        setItems([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isSports]);

  const selectedItem = slug ? items.find((item) => item.slug === slug) : null;

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.tag?.toLowerCase().includes(q) ||
      item.area?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body-md text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      <Navbar />

      <main className="w-full flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb quay về */}
          <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Link to="/" className="hover:text-orange-600 transition-colors">Trang chủ</Link>
            <span className="text-slate-300">/</span>
            {slug ? (
              <>
                <Link to={basePath} className="hover:text-orange-600 transition-colors">
                  {isSports ? 'Bộ môn thể thao' : 'Tiện ích & Cơ sở'}
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-orange-600 font-black">{selectedItem ? selectedItem.name : slug}</span>
              </>
            ) : (
              <span className="text-orange-600 font-black">{isSports ? 'Bộ môn thể thao' : 'Tiện ích & Cơ sở'}</span>
            )}
          </div>

          {/* =========================================================================
              VIEW 1: TRANG CHI TIẾT CỦA BỘ MÔN HOẶC TIỆN ÍCH (KHI CÓ SLUG)
             ========================================================================= */}
          {slug && !isLoading && selectedItem && (
            <div className="space-y-10">
              {/* Hero Banner Chi Tiết */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-950 text-white min-h-[380px] lg:min-h-[440px] flex items-end">
                <img
                  src={
                    isSports
                      ? getSportMedia(selectedItem.slug).banner || getSportMedia(selectedItem.slug).image
                      : getFacilityMedia(selectedItem.slug).image
                  }
                  alt={selectedItem.name}
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-40 transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>

                <div className="relative z-10 p-6 sm:p-10 lg:p-14 w-full max-w-4xl space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-orange-500 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                      {isSports ? (selectedItem.tag || 'TIÊU CHUẨN') : (selectedItem.highlight || '5 SAO')}
                    </span>
                    {isSports && (
                      <span className="px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider">
                        {getSportMedia(selectedItem.slug).category}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                    {selectedItem.name}
                  </h1>

                  {selectedItem.subtitle && (
                    <p className="text-sm sm:text-base font-bold uppercase text-orange-400 tracking-wider">
                      {selectedItem.subtitle}
                    </p>
                  )}

                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-medium">
                    {selectedItem.description}
                  </p>

                  <div className="pt-4 flex flex-wrap items-center gap-4">
                    <Link
                      to="/member/book"
                      className="px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Đặt Sân / Lịch Tập Ngay</span>
                      <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    </Link>
                    <Link
                      to="/pricing"
                      className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-black uppercase tracking-wider transition-all backdrop-blur-md flex items-center gap-2 cursor-pointer"
                    >
                      <span>Xem Bảng Giá Gói Tập</span>
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Thông số kỹ thuật & Tiện ích đặc quyền */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[26px]">
                      {selectedItem.icon || (isSports ? 'fitness_center' : 'stadium')}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 uppercase">Quy Mô & Không Gian</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {isSports ? (selectedItem.area || 'Khu phức hợp thể thao đa năng.') : 'Hệ thống thiết bị cao cấp đạt chuẩn quốc tế.'}
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[26px]">verified</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 uppercase">Tiêu Chuẩn Thi Đấu</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Trang thiết bị nhập khẩu chính hãng, sàn giảm chấn bảo vệ cơ khớp và hệ thống chiếu sáng không chói.
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[26px]">smart_toy</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 uppercase">Công Nghệ Hỗ Trợ</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Check-in tự động RFID, tích hợp AI Assistant đồng hành và theo dõi lịch luyện tập thông minh.
                  </p>
                </div>
              </div>

              {/* Danh sách tính năng nổi bật (nếu là bộ môn) */}
              {isSports && getSportMedia(selectedItem.slug).features?.length > 0 && (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xs space-y-6">
                  <h3 className="text-lg font-black uppercase text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500 text-[24px]">grade</span>
                    <span>Đặc Điểm Nổi Bật Của Bộ Môn {selectedItem.name}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {getSportMedia(selectedItem.slug).features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="material-symbols-outlined text-orange-500 text-[20px]">check_circle</span>
                        <span className="text-xs font-bold text-slate-800">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nút quay lại danh sách */}
              <div className="text-center pt-4">
                <Link
                  to={basePath}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-slate-300 text-slate-700 hover:text-orange-600 hover:border-orange-500 text-xs font-black uppercase tracking-wider transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Xem Tất Cả {isSports ? 'Bộ Môn' : 'Tiện Ích'} Khác</span>
                </Link>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: DANH SÁCH TẤT CẢ (KHI KHÔNG CÓ SLUG)
             ========================================================================= */}
          {!slug && (
            <>
              {/* Header Banner Trang Danh Sách */}
              <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-black uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    HỆ THỐNG ĐẲNG CẤP • F SPORT CENTER
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-900">
                    {title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Thanh tìm kiếm */}
                <div className="w-full md:w-80 shrink-0">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder={`Tìm kiếm ${isSports ? 'bộ môn' : 'tiện ích'}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Trạng thái lỗi backend */}
              {error && (
                <div role="alert" className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-center space-y-4">
                  <span className="material-symbols-outlined text-[36px] text-red-500">cloud_off</span>
                  <p className="text-xs sm:text-sm font-bold text-red-800">{error}</p>
                  <button
                    onClick={loadData}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                  >
                    Thử Lại Kết Nối
                  </button>
                </div>
              )}

              {/* Trạng thái Loading Skeletons */}
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs animate-pulse">
                      <div className="w-full h-48 bg-slate-200"></div>
                      <div className="p-6 space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                        <div className="h-3 bg-slate-100 rounded w-full"></div>
                        <div className="h-3 bg-slate-100 rounded w-4/5"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trạng thái dữ liệu rỗng */}
              {!isLoading && !error && filteredItems.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
                  <span className="material-symbols-outlined text-[48px] text-slate-300">search_off</span>
                  <p className="text-sm font-bold text-slate-700">
                    {searchQuery ? `Không tìm thấy kết quả nào phù hợp với "${searchQuery}".` : 'Chưa có dữ liệu từ máy chủ.'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-black text-orange-600 uppercase hover:underline"
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  )}
                </div>
              )}

              {/* Lưới hiển thị danh sách (Bộ môn & Tiện ích) */}
              {!isLoading && !error && filteredItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => {
                    const media = isSports
                      ? getSportMedia(item.slug)
                      : getFacilityMedia(item.slug);

                    return (
                      <article
                        key={isSports ? item.sportId : item.facilityId}
                        className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-xl hover:border-orange-300 transition-all duration-300 group"
                      >
                        <div>
                          {/* Hình ảnh minh họa nổi bật */}
                          <div className="relative w-full h-52 overflow-hidden bg-slate-100">
                            <img
                              src={media.image}
                              alt={item.name}
                              loading="lazy"
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

                            {/* Tag huy hiệu nổi góc trên */}
                            <div className="absolute top-4 left-4 flex items-center gap-2">
                              {(isSports ? item.tag : item.highlight) && (
                                <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider border border-white/20">
                                  {isSports ? item.tag : item.highlight}
                                </span>
                              )}
                            </div>

                            {/* Icon bộ môn góc dưới ảnh */}
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md">
                                <span className="material-symbols-outlined text-[20px]">
                                  {item.icon || (isSports ? 'fitness_center' : 'apartment')}
                                </span>
                              </div>
                              <span className="text-xs font-bold uppercase tracking-wider text-white drop-shadow-sm">
                                {isSports ? (item.area || 'Chuẩn Quốc Tế') : (item.highlight || '5 SAO')}
                              </span>
                            </div>
                          </div>

                          {/* Nội dung chi tiết */}
                          <div className="p-6 space-y-3">
                            <div>
                              <h2 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors uppercase">
                                {item.name}
                              </h2>
                              {isSports && item.subtitle && (
                                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Footer Card */}
                        <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-4">
                          <Link
                            to={`${basePath}/${item.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-orange-600 hover:text-orange-700 group-hover:translate-x-1 transition-transform"
                          >
                            <span>Xem Chi Tiết</span>
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </Link>

                          <Link
                            to="/member/book"
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-800 text-[11px] font-black uppercase tracking-wider transition-colors"
                          >
                            Đặt Sân
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Xử lý khi slug không khớp mục nào */}
          {slug && !isLoading && !selectedItem && (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[54px] text-slate-300">sports_handball</span>
              <h2 className="text-lg font-black text-slate-800 uppercase">Không Tìm Thấy Thông Tin</h2>
              <p className="text-xs text-slate-500 font-medium">
                Mục bạn yêu cầu hiện không có trong hệ thống dữ liệu F Sport Center.
              </p>
              <Link
                to={basePath}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-orange-500/20"
              >
                <span>Quay Lại Danh Sách {isSports ? 'Bộ Môn' : 'Tiện Ích'}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}