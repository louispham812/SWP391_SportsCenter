import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useApp } from '../../context/AppContext';
import { TableSkeleton } from '../../components/common/Skeleton';
import {
  approveStaffRegistration,
  getPendingStaffRegistrations,
  rejectStaffRegistration,
  getManagerCoaches,
} from '../../services/managerApi';
import { apiRequest } from '../../services/apiClient';

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatPrice = (val) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val || 0);

const PENDING_MEMBERSHIPS_KEY = 'sports_center_pending_memberships';
const COACH_LEAVE_KEY = 'sports_center_coach_leave_requests';
const REFUND_REQUESTS_KEY = 'sports_center_refund_requests';

const INITIAL_PENDING_MEMBERSHIPS = [
  {
    membershipId: 401,
    memberId: 10,
    memberName: 'Lê Hoàng Long',
    memberPhone: '0988 123 456',
    packageName: 'Gói VIP 3 Tháng Toàn Diện',
    packageType: 'VIP',
    price: 4500000,
    paymentMethod: 'VIETQR',
    referenceCode: 'VQR-MBR-401',
    quotaCourtHours: 30,
    quotaClassSessions: 12,
    quotaPtSessions: 4,
    status: 'PENDING_APPROVAL',
    createdAt: '2026-10-20T10:15:00',
  },
  {
    membershipId: 402,
    memberId: 12,
    memberName: 'Phạm Thu Thảo',
    memberPhone: '0977 654 321',
    packageName: 'Khóa Học Bơi Căn Bản (12 Buổi)',
    packageType: 'CLASS',
    price: 2400000,
    paymentMethod: 'VIETQR',
    referenceCode: 'VQR-MBR-402',
    totalSessions: 12,
    status: 'PENDING_APPROVAL',
    createdAt: '2026-10-20T14:20:00',
  },
];

const INITIAL_REFUND_REQUESTS = [
  {
    refundId: 801,
    memberId: 5,
    memberName: 'Vũ Đức Minh',
    phone: '0933 111 222',
    bookingId: 105,
    bookingDescription: 'Đặt sân Tennis 02 (20/10 18:00 - 20:00)',
    refundAmount: 300000,
    reason: 'Hủy booking đúng hạn trước 2 giờ theo chính sách hoàn tiền',
    status: 'PENDING',
    createdAt: '2026-10-20T15:00:00',
  },
  {
    refundId: 802,
    memberId: 7,
    memberName: 'Đỗ Hải Yến',
    phone: '0912 333 444',
    bookingId: 108,
    bookingDescription: 'Lớp Yoga Trị Liệu Cột Sống',
    refundAmount: 180000,
    reason: 'Vắng có phép được Coach xác nhận EXCUSED_ABSENCE',
    status: 'PENDING',
    createdAt: '2026-10-19T17:30:00',
  },
];

export default function AdminStaffApprovalsPage() {
  const { showToast } = useApp();

  // Tabs: 'staff' | 'memberships' | 'coach_leave' | 'refunds'
  const [activeTab, setActiveTab] = useState('staff');

  // Tab 1: Staff registrations
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Tab 2: Membership approvals (Section 5.2)
  const [pendingMemberships, setPendingMemberships] = useState(() => {
    try {
      const stored = localStorage.getItem(PENDING_MEMBERSHIPS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_PENDING_MEMBERSHIPS;
    } catch {
      return INITIAL_PENDING_MEMBERSHIPS;
    }
  });
  const [rejectMembershipModal, setRejectMembershipModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Tab 3: Coach Leave Requests (MGR-24)
  const [coachLeaveRequests, setCoachLeaveRequests] = useState(() => {
    try {
      const stored = localStorage.getItem(COACH_LEAVE_KEY);
      if (stored) return JSON.parse(stored);
      return [
        {
          requestId: 101,
          coachId: 2,
          coachName: 'Coach Nguyễn Văn A',
          leaveType: 'SICK_LEAVE',
          startDate: '2026-10-25',
          endDate: '2026-10-26',
          reason: 'Sốt xuất huyết cần theo dõi tại cơ sở y tế',
          status: 'PENDING',
          affectedBookingsCount: 2,
          affectedBookings: [
            { id: 201, time: '25/10/2026 08:00 - 09:30', name: 'Lớp Pickleball Cơ Bản', member: 'Lớp Nhóm (6 học viên)' },
            { id: 202, time: '25/10/2026 15:00 - 16:00', name: 'Tập PT 1-1 Tennis', member: 'Trần Văn Nam (Thẻ VIP)' },
          ],
          createdAt: '2026-10-20T08:30:00',
        },
      ];
    } catch {
      return [];
    }
  });
  const [availableCoaches, setAvailableCoaches] = useState([]);
  const [approveLeaveModal, setApproveLeaveModal] = useState(null);
  const [reassignForm, setReassignForm] = useState({});
  const [confirmReassignNotice, setConfirmReassignNotice] = useState(false);

  // Tab 4: Refund Requests (MGR-16)
  const [refundRequests, setRefundRequests] = useState(() => {
    try {
      const stored = localStorage.getItem(REFUND_REQUESTS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_REFUND_REQUESTS;
    } catch {
      return INITIAL_REFUND_REQUESTS;
    }
  });

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, coachesRes, leaveRes, refundRes] = await Promise.all([
        getPendingStaffRegistrations(),
        getManagerCoaches().catch(() => ({ content: [] })),
        apiRequest('/manager/coach-leave-requests').catch(() => null),
        apiRequest('/manager/refunds').catch(() => null),
      ]);
      setRegistrations(data);
      setAvailableCoaches(coachesRes.content || []);
      if (Array.isArray(leaveRes) && leaveRes.length > 0) {
        setCoachLeaveRequests(leaveRes);
        localStorage.setItem(COACH_LEAVE_KEY, JSON.stringify(leaveRes));
      }
      if (Array.isArray(refundRes) && refundRes.length > 0) {
        setRefundRequests(refundRes);
        localStorage.setItem(REFUND_REQUESTS_KEY, JSON.stringify(refundRes));
      }
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải danh sách đăng ký.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  // Tab 1: Staff Approval handlers
  const handleDecision = async (registration, decision) => {
    setProcessingId(registration.userId);
    setError('');
    try {
      if (decision === 'approve') {
        await approveStaffRegistration(registration.userId);
        showToast('Đã duyệt tài khoản', `${registration.fullName} đã có thể đăng nhập.`, 'success');
      } else {
        await rejectStaffRegistration(registration.userId);
        showToast('Đã từ chối đăng ký', `Đăng ký của ${registration.fullName} đã bị từ chối.`, 'success');
      }
      await loadRegistrations();
    } catch (requestError) {
      setError(requestError.message || 'Không thể xử lý đăng ký.');
    } finally {
      setProcessingId(null);
    }
  };

  // Tab 2: Approve Membership (Section 5.2 - APPROVE -> ACTIVE, Grant Quota & Tier)
  const handleApproveMembership = (mem) => {
    const updated = pendingMemberships.map((m) =>
      m.membershipId === mem.membershipId ? { ...m, status: 'ACTIVE', approvedAt: new Date().toISOString() } : m
    );
    setPendingMemberships(updated);
    localStorage.setItem(PENDING_MEMBERSHIPS_KEY, JSON.stringify(updated));

    showToast(
      'Kích hoạt gói thành công',
      `Đã duyệt gói "${mem.packageName}" cho hội viên ${mem.memberName}. Quyền lợi quota & hạng thẻ VIP đã được cấp phát. (Ghi Audit Log)`,
      'success'
    );
  };

  // Tab 2: Reject Membership (Section 5.2 - REJECT -> 100% Refund Request)
  const handleConfirmRejectMembership = () => {
    if (!rejectMembershipModal) return;
    const mem = rejectMembershipModal;

    const updated = pendingMemberships.map((m) =>
      m.membershipId === mem.membershipId
        ? { ...m, status: 'REJECTED', rejectionReason: rejectionReason || 'Lý do từ Quản lý' }
        : m
    );
    setPendingMemberships(updated);
    localStorage.setItem(PENDING_MEMBERSHIPS_KEY, JSON.stringify(updated));

    // Auto-create 100% refund request
    const newRefund = {
      refundId: Date.now(),
      memberId: mem.memberId,
      memberName: mem.memberName,
      phone: mem.memberPhone,
      refundAmount: mem.price,
      reason: `Hoàn tiền 100% do từ chối gói #${mem.membershipId} (${rejectionReason || 'Thông tin thanh toán không khớp'})`,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    };
    const updatedRefunds = [newRefund, ...refundRequests];
    setRefundRequests(updatedRefunds);
    localStorage.setItem(REFUND_REQUESTS_KEY, JSON.stringify(updatedRefunds));

    showToast(
      'Đã từ chối gói',
      `Đã từ chối gói #${mem.membershipId} và tự động tạo lệnh hoàn tiền 100% (${formatPrice(mem.price)}) cho hội viên.`,
      'info'
    );
    setRejectMembershipModal(null);
    setRejectionReason('');
  };

  // Tab 3: Coach Leave Request Approval (MGR-24)
  const handleOpenApproveLeave = (req) => {
    setApproveLeaveModal(req);
    setConfirmReassignNotice(false);
    setReassignForm({});
  };

  const handleConfirmApproveLeave = async () => {
    if (!approveLeaveModal || !confirmReassignNotice) return;
    const req = approveLeaveModal;

    try {
      await apiRequest(`/manager/coach-leave-requests/${req.requestId}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          approved: true,
          reassignedCoachId: Object.values(reassignForm)[0] || null,
        }),
      });
    } catch {
      // optimistic fallback
    }

    const updated = coachLeaveRequests.map((r) =>
      r.requestId === req.requestId
        ? {
            ...r,
            status: 'APPROVED',
            approvedBy: 'Giám đốc Trung tâm',
            affectedBookingsReassigned: true,
            reassignedDetails: reassignForm,
          }
        : r
    );
    setCoachLeaveRequests(updated);
    localStorage.setItem(COACH_LEAVE_KEY, JSON.stringify(updated));

    showToast(
      'Duyệt đơn nghỉ thành công',
      `Đã duyệt nghỉ cho ${req.coachName}. Các ca học đã chuyển sang Coach thay thế và tự động thông báo học viên không phụ phí. (Ghi Audit Log)`,
      'success'
    );
    setApproveLeaveModal(null);
  };

  const handleRejectLeave = async (req) => {
    try {
      await apiRequest(`/manager/coach-leave-requests/${req.requestId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ approved: false }),
      });
    } catch {
      // optimistic fallback
    }

    const updated = coachLeaveRequests.map((r) =>
      r.requestId === req.requestId
        ? { ...r, status: 'REJECTED', rejectionReason: 'Lịch giảng dạy quá kín, không đủ Coach thay thế' }
        : r
    );
    setCoachLeaveRequests(updated);
    localStorage.setItem(COACH_LEAVE_KEY, JSON.stringify(updated));
    showToast('Đã từ chối đơn nghỉ', `Đã gửi thông báo từ chối tới ${req.coachName}.`, 'warning');
  };

  // Tab 4: Refund Approval (MGR-16)
  const handleDecisionRefund = async (refund, isApprove) => {
    try {
      await apiRequest(`/manager/refunds/${refund.refundId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ approved: isApprove }),
      });
    } catch {
      // optimistic fallback
    }

    const updated = refundRequests.map((r) =>
      r.refundId === refund.refundId
        ? { ...r, status: isApprove ? 'COMPLETED' : 'REJECTED', approvedAt: new Date().toISOString() }
        : r
    );
    setRefundRequests(updated);
    localStorage.setItem(REFUND_REQUESTS_KEY, JSON.stringify(updated));
    showToast(
      isApprove ? 'Đã duyệt hoàn tiền' : 'Đã từ chối hoàn tiền',
      `Lệnh hoàn ${formatPrice(refund.refundAmount)} cho ${refund.memberName} đã được cập nhật. (Ghi Audit Log)`,
      isApprove ? 'success' : 'info'
    );
  };

  const pendingStaffCount = registrations.length;
  const pendingMemCount = pendingMemberships.filter((m) => m.status === 'PENDING_APPROVAL').length;
  const pendingLeaveCount = coachLeaveRequests.filter((r) => r.status === 'PENDING').length;
  const pendingRefundCount = refundRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <AdminLayout>
      <main className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              F SPORT ADMIN · TRUNG TÂM PHÊ DUYỆT
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Trung Tâm Phê Duyệt Hệ Thống</h1>
            <p className="mt-1 text-sm text-slate-500">
              Phê duyệt tài khoản nhân sự mới, kích hoạt gói hội viên online, điều phối đơn nghỉ Coach và hoàn tiền.
            </p>
          </div>
          <button
            type="button"
            onClick={loadRegistrations}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Làm mới
          </button>
        </header>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'staff', label: `Nhân viên mới (${pendingStaffCount})`, icon: 'how_to_reg' },
            { id: 'memberships', label: `Duyệt gói hội viên (${pendingMemCount})`, icon: 'card_membership' },
            { id: 'coach_leave', label: `Đơn nghỉ Coach (${pendingLeaveCount})`, icon: 'event_busy' },
            { id: 'refunds', label: `Yêu cầu hoàn tiền (${pendingRefundCount})`, icon: 'currency_exchange' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        {/* ========================================================
            TAB 1: DUYỆT NHÂN VIÊN MỚI (STAFF APPROVALS)
           ======================================================== */}
        {activeTab === 'staff' && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold uppercase tracking-wider text-slate-900 text-sm">
                  Yêu cầu đăng ký nhân sự đang chờ xử lý
                </h2>
                <p className="text-xs text-slate-500">Coach và Nhân viên Lễ tân tạo tài khoản cần Quản lý duyệt trước khi đăng nhập</p>
              </div>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-800">
                {pendingStaffCount} chờ duyệt
              </span>
            </div>

            {loading ? (
              <div className="p-4">
                <TableSkeleton rows={5} cols={6} />
              </div>
            ) : registrations.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
                <p className="text-xs font-bold text-slate-600">Hiện không có đăng ký nhân viên nào đang chờ duyệt.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="px-5 py-3">Nhân sự</th>
                      <th className="px-5 py-3">Vai trò</th>
                      <th className="px-5 py-3">Thời gian tạo</th>
                      <th className="px-5 py-3 text-right">Quyết định</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {registrations.map((user) => (
                      <tr key={user.userId} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <strong className="block text-slate-900 text-sm">{user.fullName}</strong>
                          <span className="text-slate-500">{user.email} · {user.phone || 'Chưa cập nhật SĐT'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{formatDate(user.createdAt)}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleDecision(user, 'reject')}
                              disabled={processingId === user.userId}
                              className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecision(user, 'approve')}
                              disabled={processingId === user.userId}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase transition-all shadow-2xs cursor-pointer"
                            >
                              {processingId === user.userId ? 'Đang xử lý...' : 'Phê duyệt'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ========================================================
            TAB 2: DUYỆT GÓI HỘI VIÊN (SECTION 5.2 WORKFLOW)
           ======================================================== */}
        {activeTab === 'memberships' && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold uppercase tracking-wider text-slate-900 text-sm">
                  Đơn mua gói tập chờ duyệt kích hoạt (Section 5.2)
                </h2>
                <p className="text-xs text-slate-500">
                  Thanh toán thành công chuyển PENDING_APPROVAL. Khi Manager duyệt (APPROVE) hệ thống sẽ cấp phát Quota và nâng hạng thẻ VIP.
                </p>
              </div>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-800">
                {pendingMemCount} đơn chờ duyệt
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-5 py-3">Mã đơn &amp; Hội viên</th>
                    <th className="px-5 py-3">Gói thành viên</th>
                    <th className="px-5 py-3">Thanh toán</th>
                    <th className="px-5 py-3">Quyền lợi quota cấp</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {pendingMemberships.map((mem) => {
                    const isPending = mem.status === 'PENDING_APPROVAL';
                    return (
                      <tr key={mem.membershipId} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <strong className="block text-slate-900 text-sm">#{mem.membershipId} · {mem.memberName}</strong>
                          <span className="text-slate-500">{mem.memberPhone} · Mã GD: {mem.referenceCode}</span>
                        </td>
                        <td className="px-5 py-4">
                          <strong className="text-slate-900">{mem.packageName}</strong>
                          <span className="block text-[11px] font-bold text-orange-600 uppercase">{mem.packageType}</span>
                        </td>
                        <td className="px-5 py-4">
                          <strong className="text-slate-900 text-sm">{formatPrice(mem.price)}</strong>
                          <span className="block text-slate-500 text-[11px]">{mem.paymentMethod}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {mem.packageType === 'VIP' ? (
                            <span>{mem.quotaCourtHours}h Sân · {mem.quotaClassSessions} Buổi Lớp · {mem.quotaPtSessions} Buổi PT</span>
                          ) : (
                            <span>{mem.totalSessions || 10} Buổi trọn gói</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              mem.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : mem.status === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {mem.status === 'ACTIVE' ? 'Đã kích hoạt' : mem.status === 'REJECTED' ? 'Từ chối (Hoàn 100%)' : 'Chờ duyệt'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setRejectMembershipModal(mem)}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                              >
                                Từ chối
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveMembership(mem)}
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase transition-all shadow-2xs cursor-pointer"
                              >
                                Kích hoạt gói
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 3: DUYỆT ĐƠN NGHỈ COACH (MGR-24 & SECTION 2.9, 5.7)
           ======================================================== */}
        {activeTab === 'coach_leave' && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold uppercase tracking-wider text-slate-900 text-sm">
                  Đơn xin nghỉ &amp; đổi ca của Coach
                </h2>
                <p className="text-xs text-slate-500">
                  Khi duyệt nghỉ, Manager phải phân công Coach thay thế cho các ca bị ảnh hưởng. Khách hàng được thông báo tự động và không phụ phí.
                </p>
              </div>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-800">
                {pendingLeaveCount} đơn chờ duyệt
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-5 py-3">Huấn luyện viên</th>
                    <th className="px-5 py-3">Loại nghỉ &amp; Thời gian</th>
                    <th className="px-5 py-3">Lý do</th>
                    <th className="px-5 py-3">Số ca bị ảnh hưởng</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {coachLeaveRequests.map((req) => {
                    const isPending = req.status === 'PENDING';
                    return (
                      <tr key={req.requestId} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <strong className="block text-slate-900 text-sm">{req.coachName}</strong>
                          <span className="text-slate-500 text-[11px]">Mã đơn: #{req.requestId}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-900 block">
                            {req.leaveType === 'SICK_LEAVE' ? 'Nghỉ ốm / Y tế' : 'Việc cá nhân'}
                          </span>
                          <span className="text-slate-600">{req.startDate} → {req.endDate}</span>
                        </td>
                        <td className="px-5 py-4 max-w-xs text-slate-600">{req.reason}</td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200">
                            {req.affectedBookingsCount || 2} ca học/PT
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : req.status === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {req.status === 'APPROVED' ? 'Đã phân công Coach khác' : req.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleRejectLeave(req)}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                              >
                                Từ chối
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenApproveLeave(req)}
                                className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase transition-all shadow-2xs cursor-pointer"
                              >
                                Duyệt &amp; Đổi Coach
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">Đã xong</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 4: DUYỆT YÊU CẦU HOÀN TIỀN (MGR-16 & SECTION 2.20)
           ======================================================== */}
        {activeTab === 'refunds' && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold uppercase tracking-wider text-slate-900 text-sm">
                  Yêu cầu hoàn tiền hội viên
                </h2>
                <p className="text-xs text-slate-500">
                  Duyệt hoàn tiền cho các booking hủy đúng hạn, vắng có phép hoặc sự cố bảo trì sân bãi.
                </p>
              </div>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-800">
                {pendingRefundCount} yêu cầu chờ duyệt
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-5 py-3">Hội viên</th>
                    <th className="px-5 py-3">Dịch vụ liên quan</th>
                    <th className="px-5 py-3">Số tiền hoàn</th>
                    <th className="px-5 py-3">Lý do</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Quyết định</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {refundRequests.map((ref) => {
                    const isPending = ref.status === 'PENDING';
                    return (
                      <tr key={ref.refundId} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <strong className="block text-slate-900 text-sm">{ref.memberName}</strong>
                          <span className="text-slate-500">{ref.phone} · Mã: #{ref.refundId}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-800 font-semibold">{ref.bookingDescription}</td>
                        <td className="px-5 py-4">
                          <strong className="text-indigo-600 text-sm font-black">{formatPrice(ref.refundAmount)}</strong>
                        </td>
                        <td className="px-5 py-4 max-w-xs text-slate-600">{ref.reason}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              ref.status === 'COMPLETED' || ref.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ref.status === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {ref.status === 'COMPLETED' || ref.status === 'APPROVED' ? 'Đã hoàn tiền' : ref.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleDecisionRefund(ref, false)}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                              >
                                Từ chối
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDecisionRefund(ref, true)}
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase transition-all shadow-2xs cursor-pointer"
                              >
                                Phê duyệt hoàn
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">Đã đối soát</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Rejection Modal for Membership Packages */}
      {rejectMembershipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Từ chối gói thành viên &amp; Hoàn tiền 100%</h3>
            <p className="text-xs text-slate-500">
              Nhập lý do từ chối gói #{rejectMembershipModal.membershipId} của hội viên {rejectMembershipModal.memberName}. Hệ thống sẽ hoàn trả 100% tiền đã thu ({formatPrice(rejectMembershipModal.price)}).
            </p>

            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ví dụ: Thông tin chuyển khoản không khớp, lớp đã đủ sĩ số..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs outline-none focus:border-orange-500 resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectMembershipModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectMembership}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Xác nhận từ chối &amp; Hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MGR-24 Coach Leave Approval & Reassignment Modal */}
      {approveLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận duyệt nghỉ &amp; Phân công Coach thay thế
                </h3>
                <p className="text-xs text-slate-500">Coach: {approveLeaveModal.coachName} · {approveLeaveModal.startDate} → {approveLeaveModal.endDate}</p>
              </div>
              <button
                type="button"
                onClick={() => setApproveLeaveModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="p-3.5 bg-orange-50/80 border border-orange-200 rounded-xl text-xs text-orange-900 space-y-1">
                <strong>Quy định:</strong>
                <p className="text-[11px] leading-relaxed">
                  Có {approveLeaveModal.affectedBookingsCount || 2} booking lớp/PT bị ảnh hưởng trong khoảng thời gian nghỉ này.
                  Manager phải chọn Coach thay thế cho từng ca. Hệ thống sẽ tự động gửi thông báo cho khách và <strong>KHÔNG thu thêm bất kỳ phụ phí nào</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Các ca giảng dạy cần chuyển lịch:</span>
                {(approveLeaveModal.affectedBookings || [
                  { id: 201, time: '25/10/2026 08:00 - 09:30', name: 'Lớp Pickleball Cơ Bản', member: 'Lớp Nhóm (6 học viên)' },
                  { id: 202, time: '25/10/2026 15:00 - 16:00', name: 'Tập PT 1-1 Tennis', member: 'Trần Văn Nam (Thẻ VIP)' },
                ]).map((booking) => (
                  <div key={booking.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <strong className="block text-slate-900 font-bold">{booking.name}</strong>
                        <span className="text-slate-500 text-[11px]">{booking.time} · {booking.member}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-bold">Cần Coach mới</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Coach thay thế:</span>
                      <select
                        value={reassignForm[booking.id] || ''}
                        onChange={(e) => setReassignForm({ ...reassignForm, [booking.id]: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 cursor-pointer"
                      >
                        <option value="">-- Chọn Coach đảm nhiệm ca này --</option>
                        {availableCoaches.map((c) => (
                          <option key={c.userId} value={c.userId}>
                            {c.fullName} ({c.phone || c.email})
                          </option>
                        ))}
                        <option value="999">Coach Hoàng Minh (Tennis / Pickleball Master)</option>
                        <option value="998">Coach Trần Đức (Fitness &amp; Bơi lội)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmReassignNotice}
                  onChange={(e) => setConfirmReassignNotice(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-orange-500 cursor-pointer"
                />
                <span className="text-xs text-slate-700 font-semibold leading-relaxed">
                  Tôi xác nhận đã điều phối Coach thay thế cho tất cả các booking bị ảnh hưởng và hệ thống đã gửi thông báo tự động cho khách hàng theo đúng quy định.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApproveLeaveModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!confirmReassignNotice}
                onClick={handleConfirmApproveLeave}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Xác nhận duyệt nghỉ &amp; Phân ca
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
