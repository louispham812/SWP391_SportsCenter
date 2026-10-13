import React, { useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useApp } from '../../context/AppContext';

export default function AdminPackagesPage() {
  const { addAuditLog } = useApp();

  const [packages, setPackages] = useState([
    {
      id: 1,
      name: 'Diamond Elite All-Access',
      sku: 'PKG-DIA-365',
      duration: 'Niên hạn 12 Tháng',
      badge: 'BEST SELLER',
      badgeColor: 'bg-amber-100 text-amber-800',
      category: 'Combo VIP',
      categoryClass: 'bg-purple-50 text-purple-700 border-purple-200',
      categoryDot: 'bg-purple-600',
      price: '45.000.000 đ',
      priceRaw: 45000000,
      note: 'Tặng 12 buổi PT',
      checkin: 'Toàn thời gian 06:00 - 22:00',
      active: true,
    },
    {
      id: 2,
      name: 'Platinum Tennis & Pickleball',
      sku: 'PKG-RAC-180',
      duration: 'Niên hạn 6 Tháng',
      badge: 'HOT ĐẶT CHỖ',
      badgeColor: 'bg-lime-100 text-lime-900',
      category: 'Tennis & Pickleball',
      categoryClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      categoryDot: 'bg-emerald-600',
      price: '22.000.000 đ',
      priceRaw: 22000000,
      note: 'Ưu tiên đặt sân trước 72h',
      checkin: 'Khung giờ vàng Peak 17:00 - 21:00',
      active: true,
    },
    {
      id: 3,
      name: 'Gold Gym & Sauna Peak',
      sku: 'PKG-GYM-180',
      duration: 'Niên hạn 6 Tháng',
      badge: null,
      badgeColor: '',
      category: 'Gym & Fitness',
      categoryClass: 'bg-blue-50 text-blue-700 border-blue-200',
      categoryDot: 'bg-blue-600',
      price: '15.000.000 đ',
      priceRaw: 15000000,
      note: 'Tặng 02 InBody Scan',
      checkin: 'Toàn thời gian 06:00 - 22:00',
      active: true,
    },
    {
      id: 4,
      name: 'Silver Morning Booster',
      sku: 'PKG-MRN-090',
      duration: 'Niên hạn 3 Tháng',
      badge: null,
      badgeColor: '',
      category: 'Gym & Fitness',
      categoryClass: 'bg-blue-50 text-blue-700 border-blue-200',
      categoryDot: 'bg-blue-600',
      price: '8.500.000 đ',
      priceRaw: 8500000,
      note: 'Tiết kiệm khung giờ sáng',
      checkin: 'Off-peak 06:00 - 14:00',
      active: true,
    },
    {
      id: 5,
      name: 'Aqua Master Pro',
      sku: 'PKG-SWM-180',
      duration: 'Niên hạn 6 Tháng',
      badge: null,
      badgeColor: '',
      category: 'Bơi lội & Phục hồi',
      categoryClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      categoryDot: 'bg-cyan-600',
      price: '12.000.000 đ',
      priceRaw: 12000000,
      note: 'Bể bơi nước mặn 4 mùa',
      checkin: 'Toàn thời gian 06:00 - 21:30',
      active: true,
    },
    {
      id: 6,
      name: 'Pickleball Starter Pass',
      sku: 'PKG-PCK-030',
      duration: 'Niên hạn 1 Tháng',
      badge: 'TẠM DỪNG',
      badgeColor: 'bg-slate-100 text-slate-600',
      category: 'Tennis & Pickleball',
      categoryClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      categoryDot: 'bg-emerald-600',
      price: '4.500.000 đ',
      priceRaw: 4500000,
      note: '10 lượt chơi sân tiêu chuẩn',
      checkin: 'Off-peak 08:00 - 16:00',
      active: false,
    },
  ]);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'Gym & Fitness' | 'Tennis & Pickleball' | 'Bơi lội & Phục hồi' | 'Combo VIP'
  const [selectedIds, setSelectedIds] = useState([1]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: 'Premium Pickleball & Gym 6 Tháng',
    price: '15.000.000 đ',
    duration: '6 Tháng',
    category: 'Tennis & Pickleball',
    timeSlot: 'Khung giờ vàng Peak (17:00 - 21:00)',
    benefitInBody: true,
    benefitLocker: true,
    benefitGuestPass: true,
  });

  const handleOpenCreateDrawer = () => {
    setEditingPkg(null);
    setFormData({
      name: '',
      price: '15.000.000 đ',
      duration: '6 Tháng',
      category: 'Tennis & Pickleball',
      timeSlot: 'Khung giờ vàng Peak (17:00 - 21:00)',
      benefitInBody: true,
      benefitLocker: true,
      benefitGuestPass: true,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (pkg) => {
    setEditingPkg(pkg);
    setFormData({
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration.replace('Niên hạn ', ''),
      category: pkg.category,
      timeSlot: pkg.checkin,
      benefitInBody: true,
      benefitLocker: true,
      benefitGuestPass: false,
    });
    setIsDrawerOpen(true);
  };

  const handleToggleActive = (id) => {
    setPackages((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.active;
          addAuditLog(
            'Thay đổi trạng thái gói tập',
            `Quản lý đã ${nextState ? 'kích hoạt' : 'tạm dừng'} gói: ${item.name}`
          );
          return {
            ...item,
            active: nextState,
            badge: nextState ? (item.badge === 'TẠM DỪNG' ? null : item.badge) : 'TẠM DỪNG',
            badgeColor: nextState ? '' : 'bg-slate-100 text-slate-600',
          };
        }
        return item;
      })
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredPackages.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSaveDrawer = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    let catClass = 'bg-blue-50 text-blue-700 border-blue-200';
    let catDot = 'bg-blue-600';
    if (formData.category === 'Combo VIP') {
      catClass = 'bg-purple-50 text-purple-700 border-purple-200';
      catDot = 'bg-purple-600';
    } else if (formData.category === 'Tennis & Pickleball') {
      catClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      catDot = 'bg-emerald-600';
    } else if (formData.category === 'Bơi lội & Phục hồi') {
      catClass = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      catDot = 'bg-cyan-600';
    }

    if (editingPkg) {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === editingPkg.id
            ? {
                ...p,
                name: formData.name,
                duration: `Niên hạn ${formData.duration}`,
                price: formData.price.includes('đ') ? formData.price : `${formData.price} đ`,
                category: formData.category,
                categoryClass: catClass,
                categoryDot: catDot,
                checkin: formData.timeSlot,
              }
            : p
        )
      );
      addAuditLog('Cập nhật gói tập', `Quản lý đã lưu thay đổi gói: ${formData.name}`);
      alert(`Đã cập nhật gói tập: ${formData.name}`);
    } else {
      const newId = Date.now();
      const codePart = formData.name.slice(0, 3).toUpperCase();
      const newPkg = {
        id: newId,
        name: formData.name,
        sku: `PKG-${codePart}-180`,
        duration: `Niên hạn ${formData.duration}`,
        badge: 'MỚI TẠO',
        badgeColor: 'bg-lime-100 text-lime-900',
        category: formData.category,
        categoryClass: catClass,
        categoryDot: catDot,
        price: formData.price.includes('đ') ? formData.price : `${formData.price} đ`,
        priceRaw: 15000000,
        note: 'Quyền lợi chuẩn Elite',
        checkin: formData.timeSlot,
        active: true,
      };
      setPackages([newPkg, ...packages]);
      addAuditLog('Tạo gói tập mới', `Quản lý đã tạo & kích hoạt gói: ${newPkg.name}`);
      alert(`Đã tạo thành công gói: ${newPkg.name}`);
    }

    setIsDrawerOpen(false);
  };

  const filteredPackages = packages.filter((p) => {
    if (activeTab !== 'all' && p.category !== activeTab) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.sku.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span>
                <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider">
                  Cơ sở Trụ sở Chính · Flagship Central
                </span>
              </span>
              <span className="font-label-sm text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Mã TT: HANOI-01
              </span>
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight font-bold mt-1">
              Membership Packages & Services
            </h1>
            <p className="font-body-lg text-xs sm:text-sm md:text-base text-slate-500">
              Cấu hình danh mục sản phẩm hội viên, chính sách giá và phân bổ quyền lợi sân bãi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => alert('Bộ lọc nâng cao: Đã áp dụng các điều kiện lọc theo chi nhánh và phân khúc giá.')}
              className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 font-semibold text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">tune</span>
              <span>Lọc nâng cao</span>
            </button>

            <button
              type="button"
              onClick={() => {
                addAuditLog('Xuất danh mục gói tập', 'Quản lý đã xuất file danh mục gói tập Excel/CSV');
                alert('Đang tải xuống tệp danh mục: Elite_Membership_Packages_2026.xlsx');
              }}
              className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 font-semibold text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">file_download</span>
              <span>Xuất dữ liệu</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateDrawer}
              className="flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[#c3f400] text-slate-950 font-bold font-label-md text-xs uppercase tracking-wider shadow-sm hover:bg-[#abd600] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>+ Thêm gói mới</span>
            </button>
          </div>
        </section>

        {/* Category Tabs & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `Tất cả (${packages.length})` },
              { id: 'Gym & Fitness', label: `Gym & Fitness (${packages.filter((p) => p.category === 'Gym & Fitness').length})` },
              { id: 'Tennis & Pickleball', label: `Tennis & Pickleball (${packages.filter((p) => p.category === 'Tennis & Pickleball').length})` },
              { id: 'Bơi lội & Phục hồi', label: `Bơi lội & Phục hồi (${packages.filter((p) => p.category === 'Bơi lội & Phục hồi').length})` },
              { id: 'Combo VIP', label: `Combo VIP (${packages.filter((p) => p.category === 'Combo VIP').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 font-semibold'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Hiển thị <span className="font-bold text-slate-800">{filteredPackages.length}</span> / {packages.length} sản phẩm hoạt động
            </span>
          </div>
        </div>

        {/* Product Table Card */}
        <div className="w-full rounded-2xl bg-white text-slate-900 shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredPackages.length && filteredPackages.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-lime-600 focus:ring-lime-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Chọn tất cả mục đang xem
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Lọc theo tên / SKU..."
                  className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-800"
                />
                <span className="material-symbols-outlined absolute left-2 top-1.5 text-[16px] text-slate-400">
                  search
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sắp xếp theo:</span>
                <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs">
                  Doanh số cao nhất ↓
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredPackages.length && filteredPackages.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-lime-600 focus:ring-lime-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 font-bold">Tên gói tập</th>
                  <th className="py-3.5 px-4 font-bold">Phân loại</th>
                  <th className="py-3.5 px-4 font-bold">Mức giá (VNĐ)</th>
                  <th className="py-3.5 px-4 font-bold">Giờ check-in</th>
                  <th className="py-3.5 px-4 text-center font-bold">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPackages.map((pkg) => {
                  const isChecked = selectedIds.includes(pkg.id);
                  return (
                    <tr
                      key={pkg.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-lime-50/20' : ''
                      }`}
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(pkg.id)}
                          className="w-4 h-4 rounded border-slate-300 text-lime-600 focus:ring-lime-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">{pkg.name}</span>
                            {pkg.badge && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${pkg.badgeColor}`}>
                                {pkg.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5">
                            Mã SKU: {pkg.sku} · {pkg.duration}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${pkg.categoryClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pkg.categoryDot}`}></span>
                          {pkg.category}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-base">{pkg.price}</span>
                          <span className="text-[11px] text-slate-400">{pkg.note}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">
                            schedule
                          </span>
                          <span>{pkg.checkin}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(pkg.id)}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center shadow-sm ${
                              pkg.active ? 'bg-[#c3f400] justify-end' : 'bg-slate-200 justify-start'
                            }`}
                            title={pkg.active ? 'Đang mở bán - Nhấn để tắt' : 'Đang tạm dừng - Nhấn để kích hoạt'}
                          >
                            <div
                              className={`w-5 h-5 rounded-full shadow-md transition-transform ${
                                pkg.active ? 'bg-slate-900' : 'bg-white'
                              }`}
                            ></div>
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDrawer(pkg)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Chỉnh sửa cấu hình gói"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn xóa gói "${pkg.name}"?`)) {
                                setPackages(packages.filter((p) => p.id !== pkg.id));
                                addAuditLog('Xóa gói tập', `Quản lý đã xóa gói: ${pkg.name}`);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa gói"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60">
            <div className="text-xs text-slate-500">
              Đang hiển thị <span className="font-bold text-slate-700">1-{filteredPackages.length}</span> trong tổng số{' '}
              <span className="font-bold text-slate-700">{packages.length}</span> sản phẩm
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 text-xs font-medium transition-colors"
              >
                Trước
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold shadow-sm"
              >
                1
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
              >
                2
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
              >
                3
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer & Backdrop (Light Mode Kinetic Lumina) */}
      {isDrawerOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity cursor-pointer animate-in fade-in"
          ></div>

          {/* Slide-over Drawer */}
          <aside className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto transition-all duration-300 animate-in slide-in-from-right">
            <div className="flex flex-col">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-lime-100 border border-lime-300 text-lime-900 text-[11px] font-bold uppercase tracking-wider w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-600"></span>
                    <span>• {editingPkg ? 'CHỈNH SỬA SẢN PHẨM' : 'TẠO SẢN PHẨM MỚI'}</span>
                  </div>
                  <h2 className="font-headline-md text-2xl text-slate-900 font-bold mt-1">
                    {editingPkg ? 'Edit Package' : '+ Add New Package'}
                  </h2>
                  <p className="font-body-sm text-xs text-slate-500">
                    Cấu hình sản phẩm hội viên & quy chế sử dụng sân bãi
                  </p>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                  title="Đóng"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Form Body */}
              <form id="package-form" onSubmit={handleSaveDrawer} className="p-6 flex flex-col gap-4">
                {/* Name Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-800 font-semibold flex items-center justify-between">
                    <span>
                      Tên gói tập <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Tối đa 60 ký tự</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Premium Pickleball & Gym 6 Tháng"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all"
                  />
                </div>

                {/* Price & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-800 font-semibold">
                      Giá niêm yết (VNĐ) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-lime-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-800 font-semibold">
                      Thời hạn gói <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white appearance-none cursor-pointer"
                      >
                        <option value="1 Tháng">1 Tháng</option>
                        <option value="3 Tháng">3 Tháng</option>
                        <option value="6 Tháng">6 Tháng</option>
                        <option value="12 Tháng">12 Tháng</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none text-[18px]">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sports Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-800 font-semibold">
                    Bộ môn áp dụng <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white appearance-none cursor-pointer"
                    >
                      <option value="Tennis & Pickleball">Tennis & Pickleball</option>
                      <option value="Gym & Fitness">Gym & Fitness</option>
                      <option value="Bơi lội & Phục hồi">Bơi lội & Phục hồi</option>
                      <option value="Combo VIP">Toàn bộ cơ sở (Combo VIP All-Access)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Time Slot */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-800 font-semibold">
                    Khung giờ áp dụng (Peak / Off-peak) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.timeSlot}
                      onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white appearance-none cursor-pointer"
                    >
                      <option value="Khung giờ vàng Peak 17:00 - 21:00">Khung giờ vàng Peak (17:00 - 21:00)</option>
                      <option value="Toàn thời gian 06:00 - 22:00">Toàn thời gian (06:00 - 22:00)</option>
                      <option value="Off-peak 06:00 - 14:00">Off-peak ban ngày (06:00 - 14:00)</option>
                      <option value="Off-peak 08:00 - 16:00">Off-peak giờ hành chính (08:00 - 16:00)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-xs text-slate-800 font-semibold">Quyền lợi đính kèm</label>
                  <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                    <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.benefitInBody}
                        onChange={(e) => setFormData({ ...formData, benefitInBody: e.target.checked })}
                        className="w-4 h-4 rounded text-lime-600 bg-white border-slate-300 focus:ring-lime-500 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        Miễn phí đo chỉ số thể chất InBody định kỳ
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.benefitLocker}
                        onChange={(e) => setFormData({ ...formData, benefitLocker: e.target.checked })}
                        className="w-4 h-4 rounded text-lime-600 bg-white border-slate-300 focus:ring-lime-500 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        Tủ đồ VIP và khăn tắm riêng biệt
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.benefitGuestPass}
                        onChange={(e) => setFormData({ ...formData, benefitGuestPass: e.target.checked })}
                        className="w-4 h-4 rounded text-lime-600 bg-white border-slate-300 focus:ring-lime-500 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        Tặng 05 lượt vé mời cho bạn bè / đối tác
                      </span>
                    </label>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="mt-1 p-4 rounded-xl bg-lime-50 border border-lime-200 flex items-center justify-between shadow-2xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Tổng giá trị gói
                    </span>
                    <span className="font-headline-md text-xl font-bold text-slate-900">
                      {formData.price}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-lime-200 border border-lime-300 text-lime-900 text-[10px] font-bold uppercase tracking-wider">
                    SẴN SÀNG BÁN
                  </span>
                </div>
              </form>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-5 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors text-xs uppercase font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="package-form"
                className="px-5 h-11 rounded-xl bg-[#c3f400] text-slate-950 hover:bg-[#abd600] transition-colors text-xs uppercase font-bold flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>✓ Lưu cấu hình & Kích hoạt</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </AdminLayout>
  );
}
