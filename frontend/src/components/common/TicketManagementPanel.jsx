import { useEffect, useId, useMemo, useState } from 'react';
import ModalDialog from './ModalDialog';
import Pagination from './Pagination';
import { TableSkeleton } from './Skeleton';
import { useApp } from '../../context/AppContext';
import {
  createReceptionistTicket,
  getReceptionistTickets,
  replyReceptionistTicket,
  searchReceptionistMembers,
} from '../../services/receptionistApi';
import {
  createManagerTicket,
  getManagerMembers,
  getManagerTickets,
  replyManagerTicket,
} from '../../services/managerApi';
import {
  formatTicketDate,
  getCategoryLabel,
  getTicketSeverityMeta,
  getTicketStatusMeta,
} from '../../utils/ticketLabels';

const TICKETS_PER_PAGE = 10;

const CREATE_CATEGORY_OPTIONS = [
  { value: 'ATTENDANCE_DISPUTE', label: 'Điểm danh sai / Vắng mặt' },
  { value: 'COACH_DISPUTE', label: 'Vấn đề Huấn luyện viên' },
  { value: 'FACILITY_ISSUE', label: 'Cơ sở vật chất / Sân bãi' },
  { value: 'PAYMENT_ISSUE', label: 'Hóa đơn / Thanh toán' },
  { value: 'OTHER', label: 'Yêu cầu hỗ trợ khác' },
];

export default function TicketManagementPanel({ mode = 'receptionist' }) {
  const { showToast } = useApp();
  const isAdmin = mode === 'admin';
  const createTitleId = useId();
  const replyTitleId = useId();

  const [refreshKey, setRefreshKey] = useState(0);
  const [ticketResponse, setTicketResponse] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Create Ticket Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchState, setMemberSearchState] = useState({ query: '', rows: [] });
  const [selectedMember, setSelectedMember] = useState(null);
  const [newCategory, setNewCategory] = useState('FACILITY_ISSUE');
  const [newSeverity, setNewSeverity] = useState('NORMAL');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Reply / Process Ticket Modal state
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyStatus, setReplyStatus] = useState('IN_REVIEW');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyError, setReplyError] = useState('');
  const [replying, setReplying] = useState(false);

  const loading = ticketResponse?.key !== refreshKey;
  const tickets = useMemo(
    () => (ticketResponse?.key === refreshKey ? ticketResponse.rows : []),
    [ticketResponse, refreshKey]
  );
  const error = ticketResponse?.key === refreshKey ? ticketResponse.error : '';

  useEffect(() => {
    let active = true;
    const fetcher = isAdmin ? getManagerTickets : getReceptionistTickets;
    fetcher()
      .then((rows) => {
        if (active) {
          setTicketResponse({ key: refreshKey, rows: Array.isArray(rows) ? rows : [], error: '' });
        }
      })
      .catch((err) => {
        if (active) {
          setTicketResponse({
            key: refreshKey,
            rows: [],
            error: err.message || 'Không thể tải danh sách ticket hỗ trợ.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [isAdmin, refreshKey]);

  useEffect(() => {
    if (!showCreateModal || memberSearch.trim().length < 2) {
      return undefined;
    }
    let active = true;
    const q = memberSearch.trim();
    const timer = window.setTimeout(() => {
      const searchFn = isAdmin
        ? () => getManagerMembers({ query: q, page: 0, size: 15 })
        : () => searchReceptionistMembers(q, 0);
      searchFn()
        .then((res) => {
          if (active) setMemberSearchState({ query: q, rows: res?.content || [] });
        })
        .catch(() => {
          if (active) setMemberSearchState({ query: q, rows: [] });
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isAdmin, memberSearch, showCreateModal]);

  const memberResults = memberSearch.trim().length >= 2 && memberSearchState.query === memberSearch.trim()
    ? memberSearchState.rows
    : [];

  const stats = useMemo(() => {
    let submitted = 0;
    let inReview = 0;
    let resolved = 0;
    tickets.forEach((t) => {
      const st = (t.status || '').toUpperCase();
      if (st === 'SUBMITTED') submitted += 1;
      else if (st === 'IN_REVIEW') inReview += 1;
      else if (st === 'RESOLVED') resolved += 1;
    });
    return { total: tickets.length, submitted, inReview, resolved };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((t) => {
      const st = (t.status || '').toUpperCase();
      const sev = (t.severity || '').toUpperCase();
      if (statusFilter !== 'ALL' && st !== statusFilter) return false;
      if (severityFilter !== 'ALL' && sev !== severityFilter) return false;
      if (!q) return true;
      return [
        t.title,
        t.description,
        t.memberName,
        t.adminResponse,
        `#tk-${t.ticketId}`,
        String(t.ticketId || ''),
      ].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [tickets, statusFilter, severityFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / TICKETS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTickets = filteredTickets.slice(
    (safePage - 1) * TICKETS_PER_PAGE,
    safePage * TICKETS_PER_PAGE
  );

  const openCreateModal = () => {
    setSelectedMember(null);
    setMemberSearch('');
    setMemberSearchState({ query: '', rows: [] });
    setNewCategory('FACILITY_ISSUE');
    setNewSeverity('NORMAL');
    setNewTitle('');
    setNewDescription('');
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!selectedMember?.userId) {
      setCreateError('Vui lòng tìm và chọn hội viên cần tạo ticket.');
      return;
    }
    if (newTitle.trim().length < 5) {
      setCreateError('Tiêu đề ticket phải có ít nhất 5 ký tự.');
      return;
    }
    if (newDescription.trim().length < 10) {
      setCreateError('Nội dung mô tả phải có ít nhất 10 ký tự.');
      return;
    }

    setCreating(true);
    try {
      const creator = isAdmin ? createManagerTicket : createReceptionistTicket;
      await creator({
        memberId: selectedMember.userId,
        category: newCategory,
        severity: newSeverity,
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
      showToast('Tạo ticket thành công', `Đã ghi nhận yêu cầu hỗ trợ cho ${selectedMember.fullName}.`, 'success');
      setShowCreateModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setCreateError(err.message || 'Không thể tạo ticket hỗ trợ.');
    } finally {
      setCreating(false);
    }
  };

  const openReplyModal = (ticket) => {
    setActiveTicket(ticket);
    setReplyStatus(ticket.status === 'SUBMITTED' ? 'IN_REVIEW' : ticket.status || 'RESOLVED');
    setReplyMessage(ticket.adminResponse || '');
    setReplyError('');
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!activeTicket) return;
    setReplyError('');
    if (['RESOLVED', 'REJECTED'].includes(replyStatus) && !replyMessage.trim()) {
      setReplyError('Vui lòng nhập nội dung phản hồi khi hoàn tất hoặc từ chối ticket.');
      return;
    }

    setReplying(true);
    try {
      const replier = isAdmin ? replyManagerTicket : replyReceptionistTicket;
      await replier(activeTicket.ticketId, {
        status: replyStatus,
        response: replyMessage.trim(),
      });
      showToast('Cập nhật ticket thành công', `Ticket #TK-${activeTicket.ticketId} đã chuyển sang ${getTicketStatusMeta(replyStatus).label}.`, 'success');
      setActiveTicket(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setReplyError(err.message || 'Không thể cập nhật ticket.');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider mb-2 ${
            isAdmin
              ? 'bg-orange-50 border-orange-200 text-orange-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isAdmin ? 'bg-orange-500' : 'bg-emerald-500'}`} />
            {isAdmin ? 'F SPORT ADMIN · QUẢN LÝ KHIẾU NẠI' : 'F SPORT RECEPTION · TIẾP NHẬN TICKET'}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {isAdmin ? 'Quản Lý & Xử Lý Khiếu Nại (Tickets)' : 'Tiếp Nhận & Hỗ Trợ Ticket Hội Viên'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? 'Theo dõi toàn bộ khiếu nại dịch vụ, tạo ticket hỗ trợ và phản hồi trực tiếp tới hội viên.'
              : 'Tạo ticket hộ hội viên tại quầy, cập nhật trạng thái xử lý và phản hồi thắc mắc nhanh chóng.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_comment</span>
            Tạo Ticket Mới
          </button>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Làm mới
          </button>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng số Ticket</span>
          <div className="mt-1.5 text-2xl font-black text-slate-900">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Chờ tiếp nhận</span>
          <div className="mt-1.5 text-2xl font-black text-amber-700">{stats.submitted}</div>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Đang xử lý</span>
          <div className="mt-1.5 text-2xl font-black text-blue-700">{stats.inReview}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Đã giải quyết</span>
          <div className="mt-1.5 text-2xl font-black text-emerald-700">{stats.resolved}</div>
        </div>
      </div>

      {/* Filters & Table */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: 'ALL', label: 'Tất cả' },
              { value: 'SUBMITTED', label: 'Chờ tiếp nhận' },
              { value: 'IN_REVIEW', label: 'Đang xử lý' },
              { value: 'RESOLVED', label: 'Đã giải quyết' },
              { value: 'REJECTED', label: 'Từ chối' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setStatusFilter(item.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === item.value
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              aria-label="Lọc mức độ khẩn"
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">Mọi mức độ</option>
              <option value="URGENT">Khẩn cấp</option>
              <option value="NORMAL">Bình thường</option>
            </select>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-slate-400">
                search
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm mã, tiêu đề, hội viên..."
                className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
            {error}
          </div>
        )}

        <div className="p-4">
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : paginatedTickets.length === 0 ? (
            <div className="py-14 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">support_agent</span>
              <p className="mt-2 font-bold text-slate-800 text-sm">Chưa có ticket hỗ trợ nào phù hợp</p>
              <p className="mt-1 text-xs text-slate-500">Thử thay đổi bộ lọc hoặc bấm &quot;Tạo Ticket Mới&quot; để tiếp nhận yêu cầu hộ hội viên.</p>
            </div>
          ) : (
            <div tabIndex={0} role="region" aria-label="Danh sách ticket hỗ trợ" className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                    <th className="py-3 px-3">Mã Ticket</th>
                    <th className="py-3 px-3">Hội viên</th>
                    <th className="py-3 px-3 min-w-[260px]">Nội dung &amp; Phản hồi</th>
                    <th className="py-3 px-3">Mức độ</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-3">Thời gian</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTickets.map((ticket) => {
                    const statusMeta = getTicketStatusMeta(ticket.status);
                    const sevMeta = getTicketSeverityMeta(ticket.severity);
                    return (
                      <tr key={ticket.ticketId} className="hover:bg-slate-50/70 align-top transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                          #TK-{ticket.ticketId}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{ticket.memberName || `Hội viên #${ticket.memberId}`}</div>
                          <div className="text-[11px] text-slate-400 font-mono">ID #{ticket.memberId}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold mb-1">
                            {getCategoryLabel(ticket.category)}
                          </span>
                          <div className="font-bold text-slate-900 text-xs">{ticket.title}</div>
                          <p className="text-slate-600 mt-0.5 line-clamp-2">{ticket.description}</p>
                          {ticket.adminResponse && (
                            <div className="mt-2 p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900">
                              <span className="font-bold">Phản hồi: </span>
                              <span>{ticket.adminResponse}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${sevMeta.badgeClass}`}>
                            {sevMeta.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusMeta.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                          {formatTicketDate(ticket.createdAt)}
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openReplyModal(ticket)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-orange-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">reply</span>
                            Xử lý / Phản hồi
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Hiển thị {(safePage - 1) * TICKETS_PER_PAGE + 1} - {Math.min(safePage * TICKETS_PER_PAGE, filteredTickets.length)} trên {filteredTickets.length} ticket
              </span>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </section>

      {/* Modal 1: Create Ticket for Member */}
      <ModalDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        titleId={createTitleId}
        maxWidthClass="max-w-lg"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 id={createTitleId} className="text-base font-bold text-slate-900">
                Tạo Ticket Hỗ Trợ Hộ Hội Viên
              </h2>
              <p className="text-xs text-slate-500">Ghi nhận phản ánh, sự cố sân bãi hoặc tranh chấp điểm danh</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              aria-label="Đóng"
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {createError && (
              <div role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700">
                {createError}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="ticket-member-search" className="text-xs font-bold text-slate-700">
                1. Chọn hội viên *
              </label>
              <input
                id="ticket-member-search"
                type="text"
                autoFocus
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setSelectedMember(null);
                }}
                placeholder="Nhập tên, SĐT hoặc email hội viên (tối thiểu 2 ký tự)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-orange-500"
              />
              {memberResults.length > 0 && !selectedMember && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {memberResults.map((m) => (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => {
                        setSelectedMember(m);
                        setMemberSearch(m.fullName);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-orange-50 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <strong className="text-slate-900 block">{m.fullName}</strong>
                        <span className="text-[11px] text-slate-500">{m.phone || m.email}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">#{m.userId}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedMember && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                  <span>
                    Hội viên: <strong>{selectedMember.fullName}</strong> (#{selectedMember.userId})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMember(null);
                      setMemberSearch('');
                    }}
                    className="font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Đổi
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="ticket-category" className="text-xs font-bold text-slate-700">
                  Danh mục *
                </label>
                <select
                  id="ticket-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                >
                  {CREATE_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="ticket-severity" className="text-xs font-bold text-slate-700">
                  Mức độ khẩn *
                </label>
                <select
                  id="ticket-severity"
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                >
                  <option value="NORMAL">Bình thường</option>
                  <option value="URGENT">Khẩn cấp</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="ticket-title" className="text-xs font-bold text-slate-700">
                Tiêu đề ticket (tối thiểu 5 ký tự) *
              </label>
              <input
                id="ticket-title"
                type="text"
                required
                minLength={5}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Hội viên phản ánh hệ thống trừ nhầm buổi quota"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="ticket-description" className="text-xs font-bold text-slate-700">
                Mô tả chi tiết (tối thiểu 10 ký tự) *
              </label>
              <textarea
                id="ticket-description"
                rows={3}
                required
                minLength={10}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Ghi rõ thời gian, sân/lớp liên quan và yêu cầu xử lý..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
              >
                {creating ? 'Đang tạo...' : 'Tạo Ticket'}
              </button>
            </div>
          </form>
        </div>
      </ModalDialog>

      {/* Modal 2: Reply & Update Ticket Status */}
      <ModalDialog
        open={Boolean(activeTicket)}
        onClose={() => setActiveTicket(null)}
        titleId={replyTitleId}
        maxWidthClass="max-w-lg"
      >
        {activeTicket && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 id={replyTitleId} className="text-base font-bold text-slate-900">
                  Xử Lý Ticket #TK-{activeTicket.ticketId}
                </h2>
                <p className="text-xs text-slate-500">
                  Hội viên: <strong>{activeTicket.memberName || `#${activeTicket.memberId}`}</strong> · {getCategoryLabel(activeTicket.category)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                aria-label="Đóng"
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1 text-xs">
              <div className="font-bold text-slate-900">{activeTicket.title}</div>
              <p className="text-slate-600 whitespace-pre-line">{activeTicket.description}</p>
            </div>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              {replyError && (
                <div role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700">
                  {replyError}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="reply-status" className="text-xs font-bold text-slate-700">
                  Trạng thái xử lý
                </label>
                <select
                  id="reply-status"
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold cursor-pointer"
                >
                  <option value="SUBMITTED">Chờ tiếp nhận</option>
                  <option value="IN_REVIEW">Đang xử lý</option>
                  <option value="RESOLVED">Đã giải quyết</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="reply-message" className="text-xs font-bold text-slate-700">
                  Nội dung phản hồi tới hội viên
                </label>
                <textarea
                  id="reply-message"
                  autoFocus
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Nhập nội dung phản hồi hoặc kết quả đối soát..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={replying}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-orange-500 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                >
                  {replying ? 'Đang lưu...' : 'Lưu & Gửi Phản Hồi'}
                </button>
              </div>
            </form>
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
