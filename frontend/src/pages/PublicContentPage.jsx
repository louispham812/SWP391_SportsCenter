import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { getPublicFacilities, getPublicSports } from '../services/publicContentApi';

export default function PublicContentPage({ contentType }) {
  const { slug } = useParams();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isSports = contentType === 'sports';
  const title = isSports ? 'Khám phá các bộ môn' : 'Tiện ích tại trung tâm';
  const description = isSports
    ? 'Tìm hiểu các bộ môn và không gian luyện tập tại Elite Sports Center.'
    : 'Khám phá các tiện ích được thiết kế để hỗ trợ trải nghiệm tập luyện của hội viên.';
  const basePath = isSports ? '/sports' : '/facilities';

  useEffect(() => {
    let isActive = true;
    const loadItems = isSports ? getPublicSports : getPublicFacilities;

    loadItems()
      .then((data) => {
        if (isActive) setItems(data);
      })
      .catch((loadError) => {
        if (isActive) {
          setError(loadError.message || 'Không thể tải nội dung. Vui lòng thử lại.');
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [isSports]);

  const selectedItem = slug ? items.find((item) => item.slug === slug) : null;
  const visibleItems = slug ? (selectedItem ? [selectedItem] : []) : items;

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-body-md text-slate-800">
      <Navbar />
      <main className="w-full flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950 mb-6"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Trang chủ
          </Link>

          <div className="mb-10">
            <span className="text-xs uppercase tracking-widest text-emerald-800 font-bold">
              Elite Sports Center
            </span>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-[#00132b]">
              {selectedItem ? selectedItem.name : title}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              {selectedItem ? selectedItem.description : description}
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              Không thể tải dữ liệu từ máy chủ: {error}
            </p>
          )}

          {isLoading && (
            <p role="status" className="py-8 text-slate-600">Đang tải nội dung...</p>
          )}

          {!isLoading && !error && !selectedItem && slug && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-slate-700">Không tìm thấy nội dung này.</p>
              <Link to={basePath} className="mt-3 inline-block font-bold text-emerald-800 hover:underline">
                Xem tất cả
              </Link>
            </div>
          )}

          {!isLoading && !error && !slug && items.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
              Hiện chưa có nội dung nào được công khai.
            </p>
          )}

          {!isLoading && !error && visibleItems.length > 0 && (
            <>
              {slug && (
                <Link to={basePath} className="mb-6 inline-flex font-bold text-emerald-800 hover:underline">
                  ← Quay lại {isSports ? 'các bộ môn' : 'các tiện ích'}
                </Link>
              )}
              <div className={`grid grid-cols-1 gap-6 ${slug ? 'max-w-3xl' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                {visibleItems.map((item) => (
                  <article
                    key={isSports ? item.sportId : item.facilityId}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-100 text-[#00132b]">
                        <span className="material-symbols-outlined text-2xl">{item.icon || 'fitness_center'}</span>
                      </div>
                      {(isSports ? item.tag : item.highlight) && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {isSports ? item.tag : item.highlight}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-[#00132b]">{item.name}</h2>
                    {isSports && item.subtitle && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {item.subtitle}
                      </p>
                    )}
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
                    {isSports && item.area && (
                      <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {item.area}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
