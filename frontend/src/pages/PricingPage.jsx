import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/apiClient';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(price || 0);

export default function PricingPage() {
  const { currentRole, showToast } = useApp();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPackageId, setSavingPackageId] = useState(null);
  const [error, setError] = useState('');
  const [purchaseMessage, setPurchaseMessage] = useState('');

  useEffect(() => {
    let current = true;
    apiRequest('/packages')
      .then((rows) => {
        if (current) setPackages(rows);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message || 'Không thể tải bảng giá từ cơ sở dữ liệu.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const handlePurchase = async (membershipPackage) => {
    setSavingPackageId(membershipPackage.packageId);
    setError('');
    setPurchaseMessage('');
    try {
      const result = await apiRequest('/members/me/memberships', {
        method: 'POST',
        body: JSON.stringify({ packageId: membershipPackage.packageId }),
      });
      const message = `Đã ghi nhận yêu cầu đăng ký "${result.packageName}". Trạng thái thanh toán: ${result.paymentStatus}.`;
      setPurchaseMessage(message);
      showToast('Đã ghi nhận đăng ký', message, 'info');
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo yêu cầu đăng ký.');
    } finally {
      setSavingPackageId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-body-md text-on-surface">
      <Navbar />
      <main className="w-full flex-1 pt-20">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <header className="mb-8 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary">Bảng giá hiện hành</p>
            <h1 className="mt-2 text-3xl font-bold uppercase tracking-tight text-primary sm:text-5xl">
              Gói tập &amp; hội viên
            </h1>
            <p className="mt-3 text-slate-600">
              Danh sách, giá và thời hạn được tải trực tiếp từ cơ sở dữ liệu.
            </p>
          </header>

          {error && (
            <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </p>
          )}
          {purchaseMessage && (
            <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {purchaseMessage}
            </p>
          )}

          {loading ? (
            <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
              Đang tải bảng giá...
            </p>
          ) : packages.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
              Cơ sở dữ liệu chưa có gói tập đang mở bán.
            </p>
          ) : (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((membershipPackage) => (
                <article key={membershipPackage.packageId} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                      {membershipPackage.accessType?.replaceAll('_', ' ') || 'Gói tập'}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-primary">{membershipPackage.name}</h2>
                    <p className="mt-4 text-3xl font-bold text-slate-900">{formatPrice(membershipPackage.price)}</p>
                    <p className="mt-1 text-sm text-slate-500">Thời hạn {membershipPackage.durationDays} ngày</p>
                    {membershipPackage.description && (
                      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                        {membershipPackage.description}
                      </p>
                    )}
                  </div>
                  {currentRole === 'member' ? (
                    <button
                      type="button"
                      disabled={savingPackageId !== null}
                      onClick={() => handlePurchase(membershipPackage)}
                      className="mt-6 rounded-xl bg-secondary-container px-4 py-3 text-xs font-bold uppercase text-primary shadow-sm hover:bg-secondary-fixed-dim disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingPackageId === membershipPackage.packageId ? 'Đang gửi yêu cầu...' : 'Đăng ký gói'}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="mt-6 rounded-xl bg-primary px-4 py-3 text-center text-xs font-bold uppercase text-white hover:bg-slate-800"
                    >
                      Đăng nhập để đăng ký
                    </Link>
                  )}
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
