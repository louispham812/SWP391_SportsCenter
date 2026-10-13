/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import {
  mockUsers,
  mockMembersList,
  mockCoachesList,
  mockPackages,
  mockClasses,
  mockFacilities,
  mockCheckIns,
  mockAuditLogs,
  mockSports,
  mockVouchers,
  mockRetailInventory,
  mockLockers,
  mockSupportTickets,
  mockRefundRequests,
  mockCoachReviews,
  mockPaymentHistory,
} from '../data/mockData';

const AppContext = createContext();

let idCounter = 2000;
const generateId = (prefix) => {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
};

export function AppProvider({ children }) {
  // 1. Current Active Role for Testing
  const [currentRole, setCurrentRole] = useState('member'); // 'member' | 'receptionist' | 'coach' | 'admin'

  // 2. Core Collections
  const [members, setMembers] = useState(mockMembersList);
  const [classes, setClasses] = useState(mockClasses);
  const [checkIns, setCheckIns] = useState(mockCheckIns);
  const [auditLogs, setAuditLogs] = useState(mockAuditLogs);
  const [facilities, setFacilities] = useState(mockFacilities);
  const [packages, setPackages] = useState(mockPackages);
  const [sports, setSports] = useState(mockSports);
  const [vouchers, setVouchers] = useState(mockVouchers);
  const [retailInventory, setRetailInventory] = useState(mockRetailInventory);
  const [lockers, setLockers] = useState(mockLockers);
  const [supportTickets, setSupportTickets] = useState(mockSupportTickets);
  const [refundRequests, setRefundRequests] = useState(mockRefundRequests);
  const [coachReviews, setCoachReviews] = useState(mockCoachReviews);
  const [paymentHistory, setPaymentHistory] = useState(mockPaymentHistory);

  // 3. User & Profile State (Member: Nguyễn Minh Anh)
  const [currentUser, setCurrentUser] = useState(mockUsers.member);
  const [healthProfile, setHealthProfile] = useState({
    fitnessLevel: 'intermediate', // 'beginner' | 'intermediate' | 'advanced'
    fitnessGoals: 'Tăng phản xạ, giảm mỡ & hoàn thiện kỹ thuật Pickleball',
    injuryHistory: 'Bong gân cổ chân phải (2024), đã phục hồi 95%',
    weight: 64.2,
    smm: 32.5,
    pbf: 17.8,
    bmi: 21.4,
    height: 168,
    lastTested: '18/11/2026',
  });

  // Active Member Plan State
  const [activePlan, setActivePlan] = useState({
    name: 'Gói Pickleball Match Pass & VIP Diamond',
    tier: 'Diamond Member',
    status: 'active',
    startDate: '15/12/2025',
    expireDate: '15/12/2026',
    remainingDays: 320,
    remainingPTSessions: 8,
    barcode: '893850129841',
  });

  // 4. Staff Accounts & RBAC (Manager: MGR-01, MGR-02)
  const [staffList, setStaffList] = useState([
    {
      id: 1,
      name: 'Trần Hoàng Long',
      role: 'Quản Lý Trung Tâm (Center Manager)',
      roleKey: 'admin',
      roleBadge: 'bg-primary text-secondary-container',
      phone: '0901 111 222',
      email: 'hoanglong@elitesports.vn',
      specialty: 'Điều hành tổng thể & Kế hoạch chiến lược',
      status: 'active',
    },
    {
      id: 2,
      name: 'Lê Anh Tuấn',
      role: 'Huấn Luyện Viên (Master Coach)',
      roleKey: 'coach',
      roleBadge: 'bg-secondary-container text-primary',
      phone: '0905 333 444',
      email: 'anhtuan.le@elitesports.vn',
      specialty: 'Pickleball PPR & Biomechanics (NASM)',
      status: 'active',
    },
    {
      id: 3,
      name: 'Vũ Thu Hà',
      role: 'Huấn Luyện Viên (Coach)',
      roleKey: 'coach',
      roleBadge: 'bg-secondary-container text-primary',
      phone: '0908 555 666',
      email: 'thuha.vu@elitesports.vn',
      specialty: 'Yoga & Pilates Reformer Allegro 2',
      status: 'active',
    },
    {
      id: 4,
      name: 'Hoàng Thu Trang',
      role: 'Nhân Viên Lễ Tân (Receptionist)',
      roleKey: 'receptionist',
      roleBadge: 'bg-slate-100 text-slate-800',
      phone: '0919 777 888',
      email: 'thutrang@elitesports.vn',
      specialty: 'Quầy tiếp đón ca sáng & Thu ngân POS',
      status: 'active',
    },
  ]);

  const [permissionsMatrix, setPermissionsMatrix] = useState([
    { id: 'p1', feature: 'Quản lý Hội viên & Khóa thẻ', manager: true, coach: false, receptionist: true, member: false },
    { id: 'p2', feature: 'Xem Báo cáo Tài chính & Doanh thu', manager: true, coach: false, receptionist: false, member: false },
    { id: 'p3', feature: 'Cấu hình Gói tập & Voucher giá', manager: true, coach: false, receptionist: false, member: false },
    { id: 'p4', feature: 'Phân công HLV & Lịch sân bãi', manager: true, coach: false, receptionist: false, member: false },
    { id: 'p5', feature: 'Điểm danh học viên & Giao bài tập', manager: true, coach: true, receptionist: true, member: false },
    { id: 'p6', feature: 'Thu ngân POS & In hóa đơn', manager: true, coach: false, receptionist: true, member: false },
    { id: 'p7', feature: 'Đặt lớp học & Hủy lịch cá nhân', manager: true, coach: false, receptionist: true, member: true },
    { id: 'p8', feature: 'Gửi khiếu nại & Đánh giá dịch vụ', manager: true, coach: false, receptionist: true, member: true },
  ]);

  // 5. AI Settings (Manager: MGR-15)
  const [aiSettings, setAiSettings] = useState({
    enabledChatbot: true,
    enabledWorkoutGen: true,
    model: 'Gemini Pro Athletic Specialist',
    promptRules: 'Ưu tiên an toàn chấn thương, tuân thủ nội quy hủy lớp trước 2 tiếng và kiểm tra y tế PAR-Q trước khi chỉ định bài tập cường độ cao.',
  });

  // 6. Toast Notification System
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (title, message, type = 'success') => {
    const id = generateId('toast');
    const newToast = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  // Switch Role Handler
  const switchRole = (newRole) => {
    setCurrentRole(newRole);
    if (mockUsers[newRole]) {
      setCurrentUser(mockUsers[newRole]);
      showToast('Chuyển đổi phân hệ', `Đang thao tác với quyền: ${mockUsers[newRole].roleTitle}`, 'info');
    }
  };

  const authenticateUser = (user, roleKey) => {
    const roleTitles = {
      member: 'Hội viên Thể thao',
      receptionist: 'Nhân viên Lễ tân',
      coach: 'Huấn luyện viên',
      admin: 'Giám đốc Trung tâm',
    };
    setCurrentRole(roleKey);
    setCurrentUser({
      id: user.userId,
      name: user.fullName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      roleTitle: roleTitles[roleKey],
      avatar: user.fullName
        .split(/\s+/)
        .map((part) => part[0])
        .slice(-2)
        .join('')
        .toUpperCase(),
    });
    showToast('Đăng nhập thành công', `Xin chào ${user.fullName}!`);
  };

  // Helper: Add Audit Log (MGR-14)
  const addAuditLog = (action, target) => {
    const log = {
      id: generateId('log'),
      action,
      target,
      user: currentUser.name || 'Người dùng',
      time: 'Vừa xong',
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  // ==========================================
  // FLOW 1: USER & MEMBERSHIP MANAGEMENT
  // ==========================================

  // MEM-03: Update Member Profile
  const updateProfile = (data) => {
    setCurrentUser((prev) => ({ ...prev, ...data }));
    addAuditLog('Cập nhật hồ sơ', `Hội viên ${data.name || currentUser.name} đã cập nhật thông tin cá nhân`);
    showToast('Cập nhật thành công', 'Hồ sơ cá nhân và thông tin liên hệ đã được lưu!');
  };

  // MEM-05: Update Health Profile
  const updateHealthProfile = (data) => {
    setHealthProfile((prev) => ({ ...prev, ...data }));
    addAuditLog('Cập nhật hồ sơ sức khỏe', `Hội viên đã cập nhật mục tiêu & chỉ số InBody`);
    showToast('Hồ sơ thể trạng', 'Đã lưu mục tiêu thể thao và lịch sử chấn thương!');
  };

  // MEM-07 / MEM-09: Purchase or Renew Package
  const purchasePackage = (pkg, voucherCode = '', paymentMethod = 'VNPAY-QR') => {
    let finalPrice = pkg.price || (pkg.priceMonthly ? pkg.priceMonthly : 2500000);
    let discountAmount = 0;

    if (voucherCode) {
      const v = vouchers.find((item) => item.code.toUpperCase() === voucherCode.toUpperCase() && item.status === 'active');
      if (v) {
        discountAmount = Math.min((finalPrice * v.discountPercent) / 100, v.maxDiscount);
        finalPrice = finalPrice - discountAmount;
      }
    }

    const newInvoice = {
      id: generateId('inv'),
      invoiceId: `INV-${2000 + (idCounter % 8000)}`,
      date: new Date().toLocaleDateString('vi-VN'),
      description: `Đăng ký gói: ${pkg.name} (${voucherCode ? `Mã: ${voucherCode}` : 'Giá niêm yết'})`,
      amount: finalPrice,
      method: paymentMethod,
      status: 'Thành công',
      cashier: 'Cổng thanh toán Online',
    };

    setPaymentHistory([newInvoice, ...paymentHistory]);
    setActivePlan((prev) => ({
      ...prev,
      name: pkg.name,
      status: 'active',
      remainingDays: prev.remainingDays + 365,
      remainingPTSessions: prev.remainingPTSessions + (pkg.type === 'tier' ? 6 : 10),
    }));

    addAuditLog('Thanh toán gói tập', `Hội viên ${currentUser.name} thanh toán ${pkg.name} (${finalPrice.toLocaleString('vi-VN')} ₫)`);
    showToast('Kích hoạt gói tập thành công', `Gói "${pkg.name}" đã kích hoạt. Hóa đơn điện tử #${newInvoice.invoiceId} đã được xuất!`);
    return newInvoice;
  };

  // REC-02 / REC-05: Add New Member at Desk
  const addMember = (newMem) => {
    const memId = generateId('mem');
    const created = {
      id: memId,
      memberId: `ELT-${1000 + (idCounter % 9000)}`,
      name: newMem.name,
      phone: newMem.phone,
      email: newMem.email || 'customer@elitesports.vn',
      tier: newMem.tier || 'Silver',
      status: 'active',
      joined: new Date().toLocaleDateString('vi-VN'),
      expires: '19/11/2027',
      enrolledClassesCount: 0,
      wallet: 0,
    };
    setMembers([created, ...members]);
    addAuditLog('Tạo thẻ hội viên mới', `Đăng ký hội viên mới: ${created.name} (${created.memberId}) tại quầy`);
    showToast('Tạo hội viên thành công', `Hội viên ${created.name} (${created.memberId}) đã được cấp thẻ ${created.tier}!`);
    return created;
  };

  // REC-09: Freeze Package (Bảo lưu gói tập)
  const freezePackage = (memberId, days, reason) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId || m.memberId === memberId) {
          showToast('Bảo lưu thành công', `Đã bảo lưu thẻ hội viên ${m.name} trong ${days} ngày (Lý do: ${reason})`);
          addAuditLog('Bảo lưu thẻ hội viên', `Bảo lưu thẻ của ${m.name} (${days} ngày)`);
          return { ...m, status: 'frozen', note: `Bảo lưu ${days} ngày: ${reason}` };
        }
        return m;
      })
    );
  };

  // REC-10: Transfer Package (Chuyển nhượng gói tập)
  const transferPackage = (fromMemberName, toMemberName, transferFee = 250000) => {
    addAuditLog('Chuyển nhượng gói tập', `Chuyển quyền thẻ hội viên từ [${fromMemberName}] sang [${toMemberName}], phí: ${transferFee.toLocaleString('vi-VN')} ₫`);
    showToast('Chuyển nhượng hoàn tất', `Gói tập của ${fromMemberName} đã được bàn giao thành công cho ${toMemberName}!`);
  };

  // REC-08: Issue RFID Card or Dynamic QR
  const issueRfidCard = (memberId, cardCode) => {
    addAuditLog('Cấp thẻ từ / RFID', `Gán mã thẻ RFID #${cardCode} cho hội viên #${memberId}`);
    showToast('Cấp thẻ từ thành công', `Mã RFID ${cardCode} đã liên kết thành công vào hồ sơ học viên!`);
  };

  // MGR-03: Toggle Member Status (Khóa/Mở)
  const toggleMemberStatus = (memberId) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const nextStatus = m.status === 'active' ? 'suspended' : 'active';
          showToast('Cập nhật trạng thái hội viên', `${m.name}: Chuyển sang ${nextStatus === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}`, nextStatus === 'active' ? 'success' : 'warning');
          addAuditLog('Cập nhật trạng thái hội viên', `Chuyển trạng thái ${m.name} sang ${nextStatus}`);
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
  };

  // ==========================================
  // FLOW 2: CLASS BOOKING & SCHEDULE MANAGEMENT
  // ==========================================

  // MEM-15: Member Books Class
  const bookClass = (classId) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          if (c.enrolled >= c.capacity) {
            showToast('Lớp học đã kín chỗ', 'Lớp đã đủ sĩ số. Bạn có thể bấm "Tham gia Hàng đợi" để nhận thông báo.', 'error');
            return c;
          }
          const updated = {
            ...c,
            enrolled: c.enrolled + 1,
            isBooked: true,
            students: [
              ...(c.students || []),
              {
                id: currentUser.id || 'mem_01',
                name: currentUser.name || 'Nguyễn Minh Anh',
                phone: currentUser.phone || '0987 654 321',
                status: 'present',
                note: 'Đăng ký qua ứng dụng hội viên',
              },
            ],
          };
          addAuditLog('Đặt lớp học', `Hội viên ${currentUser.name} đã đặt chỗ lớp: ${c.title}`);
          showToast('Đặt chỗ thành công', `Bạn đã giữ chỗ thành công lớp "${c.title}" (${c.time})!`);
          return updated;
        }
        return c;
      })
    );
  };

  // MEM-17: Member Cancels Class
  const cancelClass = (classId) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          const updated = {
            ...c,
            enrolled: Math.max(0, c.enrolled - 1),
            isBooked: false,
            students: (c.students || []).filter((st) => st.name !== currentUser.name),
          };
          addAuditLog('Hủy đặt chỗ', `Hội viên ${currentUser.name} đã hủy lớp: ${c.title}`);
          showToast('Hủy đặt chỗ thành công', `Đã hủy lịch học lớp "${c.title}". Vị trí đã được hoàn lại.`, 'info');
          return updated;
        }
        return c;
      })
    );
  };

  // MEM-16: Join Waitlist
  const joinWaitlist = (classId) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          const waitlist = c.waitlist || [];
          const updated = {
            ...c,
            isWaitlisted: true,
            waitlist: [...waitlist, { id: currentUser.id || 'mem_01', name: currentUser.name, phone: currentUser.phone }],
          };
          addAuditLog('Tham gia danh sách chờ', `Hội viên ${currentUser.name} vào hàng đợi lớp: ${c.title}`);
          showToast('Đã vào danh sách chờ', `Bạn đã vào hàng đợi lớp "${c.title}". Khi có người hủy, hệ thống sẽ tự động gửi thông báo!`);
          return updated;
        }
        return c;
      })
    );
  };

  // REC-17: Promote from Waitlist to Enrolled
  const promoteFromWaitlist = (classId, studentName) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          const waitlist = (c.waitlist || []).filter((s) => s.name !== studentName);
          const students = [
            ...(c.students || []),
            { id: generateId('st'), name: studentName, phone: '0987 654 321', status: 'present', note: 'Đôn từ danh sách chờ' },
          ];
          addAuditLog('Đôn danh sách chờ', `Lễ tân đã đôn học viên ${studentName} vào lớp chính: ${c.title}`);
          showToast('Đôn học viên thành công', `Đã đưa ${studentName} vào danh sách chính của lớp "${c.title}"!`);
          return { ...c, waitlist, students, enrolled: c.enrolled + 1 };
        }
        return c;
      })
    );
  };

  // MGR-08 / MGR-09: Create Class Session & Assign Coach
  const createClassSession = (sessionData) => {
    const newClass = {
      id: generateId('cls'),
      sport: sessionData.sport || 'pickleball',
      title: sessionData.title,
      coachId: sessionData.coachId || 'coa_01',
      coachName: sessionData.coachName || 'HLV Lê Anh Tuấn',
      time: sessionData.time || '18:00 - 19:30',
      day: sessionData.day || 'Thứ Bảy, 23/11',
      room: sessionData.room || 'Sân Mái Che Pro 01',
      capacity: Number(sessionData.capacity) || 10,
      enrolled: 0,
      isBooked: false,
      students: [],
    };
    setClasses([newClass, ...classes]);
    addAuditLog('Xếp lịch lớp học mới', `Đã mở lớp "${newClass.title}" phân công ${newClass.coachName}`);
    showToast('Mở lớp thành công', `Lớp học "${newClass.title}" đã được thêm vào thời khóa biểu!`);
  };

  // MGR-19: Toggle Court Maintenance
  const toggleFacilityMaintenance = (facId) => {
    setFacilities((prev) =>
      prev.map((f) => {
        if (f.id === facId) {
          const nextStatus = f.status === 'active' ? 'maintenance' : 'active';
          addAuditLog('Thay đổi trạng thái sân bãi', `Cơ sở ${f.name} chuyển sang ${nextStatus === 'maintenance' ? 'Bảo trì tạm thời' : 'Sẵn sàng phục vụ'}`);
          showToast('Cập nhật trạng thái sân', `${f.name}: Đã chuyển sang ${nextStatus === 'maintenance' ? 'Bảo trì (Khóa xếp lịch)' : 'Hoạt động bình thường'}`, nextStatus === 'maintenance' ? 'warning' : 'success');
          return { ...f, status: nextStatus };
        }
        return f;
      })
    );
  };

  // ==========================================
  // FLOW 3: PAYMENT & FINANCIAL REPORTS
  // ==========================================

  // REC-18 / REC-19 / REC-24: Process POS Checkout
  const processPOSPayment = (cartItems, method, customerName = 'Khách lẻ vãng lai', discount = 0) => {
    const totalRaw = cartItems.reduce((acc, it) => acc + it.price * it.qty, 0);
    const finalAmount = Math.max(0, totalRaw - discount);
    const nextInvId = `INV-${2000 + (idCounter % 8000)}`;

    const newInvoice = {
      id: generateId('pos_inv'),
      invoiceId: nextInvId,
      date: new Date().toLocaleDateString('vi-VN'),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      items: [...cartItems],
      subtotal: totalRaw,
      discount,
      total: finalAmount,
      method: method.toUpperCase(),
      cashier: 'Hoàng Thu Trang',
      customer: customerName,
      status: 'Thành công',
    };

    setPaymentHistory([newInvoice, ...paymentHistory]);
    addAuditLog('Thu ngân POS tại quầy', `Lễ tân xuất hóa đơn #${newInvoice.invoiceId} (${finalAmount.toLocaleString('vi-VN')} ₫) cho ${customerName}`);
    showToast('Thanh toán POS hoàn tất', `Đã lập hóa đơn #${newInvoice.invoiceId} (${finalAmount.toLocaleString('vi-VN')} ₫). Hóa đơn nhiệt sẵn sàng in!`);
    return newInvoice;
  };

  // REC-21: Submit Refund Request
  const submitRefundRequest = (transactionId, memberName, amount, reason) => {
    const newRef = {
      id: generateId('ref'),
      transactionId,
      memberName,
      amount: Number(amount),
      reason,
      requestedBy: 'Lễ tân Hoàng Thu Trang',
      status: 'pending',
      requestedAt: 'Vừa xong',
    };
    setRefundRequests([newRef, ...refundRequests]);
    addAuditLog('Đề nghị hoàn tiền', `Lễ tân gửi yêu cầu hoàn tiền #${transactionId} (${Number(amount).toLocaleString('vi-VN')} ₫) chờ Quản lý duyệt`);
    showToast('Đã gửi đề nghị hoàn phí', `Yêu cầu hoàn tiền #${transactionId} đã gửi đến Giám đốc trung tâm!`, 'info');
  };

  // MGR-16: Manager Approves / Rejects Refund
  const approveRefund = (refundId, isApproved) => {
    setRefundRequests((prev) =>
      prev.map((r) => {
        if (r.id === refundId) {
          const status = isApproved ? 'approved' : 'rejected';
          addAuditLog('Phê duyệt hoàn tiền', `Quản lý đã ${isApproved ? 'CHẤP THUẬN' : 'TỪ CHỐI'} đơn hoàn phí #${r.transactionId}`);
          showToast('Xử lý hoàn tiền', `Đơn #${r.transactionId} đã được ${isApproved ? 'phê duyệt hoàn trả' : 'từ chối'}!`, isApproved ? 'success' : 'warning');
          return { ...r, status };
        }
        return r;
      })
    );
  };

  // ==========================================
  // FLOW 4: TRAINING & ATTENDANCE MANAGEMENT
  // ==========================================

  // REC-11 / REC-12: Member Check-in at Gate
  const checkInMember = (query) => {
    const matched = members.find(
      (m) =>
        m.phone.includes(query) ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.memberId.toLowerCase().includes(query.toLowerCase())
    );

    const checkInId = generateId('chk');
    const assignedLocker = `#${10 + (idCounter % 40)}`;
    const isExpired = matched && matched.status === 'expired';

    const newLog = {
      id: checkInId,
      memberId: matched ? matched.memberId : `ELT-${1000 + (idCounter % 9000)}`,
      name: matched ? matched.name : query,
      tier: matched ? `${matched.tier} Member` : 'Silver Member',
      plan: isExpired ? 'Gói Tập (Đã hết hạn)' : 'Gói Toàn Năng 5 Sao',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      method: 'Quét mã QR App / Thẻ từ',
      locker: isExpired ? 'Không cấp' : assignedLocker,
      status: isExpired ? 'expired' : 'valid',
    };

    setCheckIns([newLog, ...checkIns]);
    addAuditLog('Check-in tại quầy', `Lễ tân check-in: ${newLog.name} (${newLog.memberId})`);

    if (newLog.status === 'expired') {
      showToast('Cảnh báo thẻ hết hạn', `Hội viên ${newLog.name} (${newLog.memberId}) đã hết hạn gói tập! Cửa không mở.`, 'error');
    } else {
      showToast('Check-in thành công', `Hội viên: ${newLog.name} • Cửa đã mở • Tủ đồ: ${newLog.locker}`, 'success');
    }
    return newLog;
  };

  // REC-13: Manage Lockers & Towels
  const assignLocker = (memberId, lockerNum) => {
    setLockers((prev) =>
      prev.map((l) => (l.number === lockerNum ? { ...l, status: 'in-use', assignedTo: `#${memberId}` } : l))
    );
    showToast('Cấp tủ đồ', `Đã cấp tủ đồ ${lockerNum} cho hội viên!`);
  };

  const releaseLocker = (lockerId) => {
    setLockers((prev) =>
      prev.map((l) => (l.id === lockerId ? { ...l, status: 'available', assignedTo: null } : l))
    );
    showToast('Trả tủ đồ', 'Tủ đồ đã được mở khóa và sẵn sàng cho khách tiếp theo!');
  };

  // COA-05 / COA-08 / COA-09: Coach Saves Attendance & Review
  const saveClassAttendance = (classId, updatedStudents, coachNote) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, students: updatedStudents, coachNote } : c
      )
    );
    addAuditLog('Lưu điểm danh lớp', `HLV đã lưu điểm danh lớp học #${classId}`);
    showToast('Đã lưu điểm danh & đánh giá', 'Dữ liệu chuyên cần và nhận xét của học viên đã được đồng bộ hóa!');
  };

  // COA-06: 1-on-1 PT Check-in (Deduct 1 PT session)
  const checkInPTSession = (studentName, maxWeight, timeRecord, coachFeedback) => {
    setActivePlan((prev) => ({
      ...prev,
      remainingPTSessions: Math.max(0, prev.remainingPTSessions - 1),
    }));
    addAuditLog('Điểm danh ca PT 1:1', `HLV điểm danh buổi tập cho ${studentName}. Mức tạ: ${maxWeight}kg - Trừ 1 buổi PT.`);
    showToast('Điểm danh PT thành công', `Đã ghi nhận buổi tập cho ${studentName}. Đã trừ 1 buổi PT (Còn lại: ${Math.max(0, activePlan.remainingPTSessions - 1)} buổi)`);
  };

  // COA-10: Assign Homework
  const assignHomework = (className, title, content) => {
    addAuditLog('Giao bài tập về nhà', `HLV đã gửi bài tập "${title}" cho lớp ${className}`);
    showToast('Gửi bài tập thành công', `Đã giao bài tập "${title}" cho toàn bộ học viên!`);
  };

  // MEM-27: Rate Coach / Class
  const addCoachReview = (review) => {
    const newRev = {
      id: generateId('rev'),
      coachId: review.coachId || 'coa_01',
      coachName: review.coachName || 'HLV Lê Anh Tuấn',
      memberName: currentUser.name || 'Nguyễn Minh Anh',
      rating: Number(review.rating) || 5,
      comment: review.comment,
      className: review.className || 'Pickleball Chiến Thuật Nâng Cao',
      date: new Date().toLocaleDateString('vi-VN'),
    };
    setCoachReviews([newRev, ...coachReviews]);
    addAuditLog('Đánh giá HLV', `Hội viên ${currentUser.name} đánh giá ${newRev.rating} sao cho ${newRev.coachName}`);
    showToast('Đánh giá thành công', `Cảm ơn bạn đã đóng góp ý kiến cho HLV ${newRev.coachName}!`);
  };

  // COA-12: Coach Requests Leave / Shift Swap
  const requestCoachLeave = (date, reason, subCoach) => {
    addAuditLog('HLV xin đổi ca', `HLV đề nghị đổi ca ngày ${date} cho ${subCoach} (Lý do: ${reason})`);
    showToast('Gửi đơn xin nghỉ/đổi ca', 'Đơn xin đổi ca đã được chuyển đến Quản lý trung tâm để duyệt!');
  };

  // ==========================================
  // FLOW 5 & 6: AI WORKOUT & AI ASSISTANT
  // ==========================================

  // MGR-15: Update AI Settings
  const updateAISettings = (newSettings) => {
    setAiSettings((prev) => ({ ...prev, ...newSettings }));
    addAuditLog('Cấu hình AI', 'Quản lý đã cập nhật System Prompt & chính sách cho AI Chatbot');
    showToast('Cấu hình AI thành công', 'Tham số trợ lý ảo AI và quy tắc tư vấn đã được lưu!');
  };

  // ==========================================
  // MANAGER OPERATIONS (MGR-01, MGR-02, MGR-18, MGR-20)
  // ==========================================

  // MGR-01: Staff Management
  const addStaff = (data) => {
    const newStaffMember = {
      id: staffList.length + 1,
      name: data.name,
      role: data.roleTitle || 'Huấn Luyện Viên (Coach)',
      roleKey: data.roleKey || 'coach',
      roleBadge: data.roleKey === 'coach' ? 'bg-secondary-container text-primary' : 'bg-slate-100 text-slate-800',
      phone: data.phone,
      email: data.email,
      specialty: data.specialty || 'Chuyên viên thể thao',
      status: 'active',
    };
    setStaffList([...staffList, newStaffMember]);
    addAuditLog('Thêm nhân viên mới', `Tạo tài khoản nhân viên ${newStaffMember.name} (${newStaffMember.role})`);
    showToast('Thêm nhân sự thành công', `Nhân viên ${newStaffMember.name} đã được cấp quyền truy cập hệ thống!`);
  };

  const toggleStaffStatus = (id) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus = s.status === 'active' ? 'locked' : 'active';
          addAuditLog('Thay đổi trạng thái nhân sự', `Nhân viên ${s.name} chuyển sang ${nextStatus}`);
          showToast('Trạng thái nhân sự', `Tài khoản ${s.name} đã được ${nextStatus === 'active' ? 'mở khóa' : 'khóa tạm thời'}`);
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  // MGR-02: Update RBAC Permissions
  const updatePermission = (permId, roleKey, value) => {
    setPermissionsMatrix((prev) =>
      prev.map((p) => (p.id === permId ? { ...p, [roleKey]: value } : p))
    );
    showToast('Phân quyền thành công', 'Cấu hình quyền truy cập vai trò đã được cập nhật!', 'info');
  };

  // MGR-18: Add Voucher Campaign
  const addVoucher = (voucher) => {
    const newVoucher = {
      id: generateId('v'),
      code: voucher.code.toUpperCase(),
      discountPercent: Number(voucher.discountPercent) || 10,
      maxDiscount: Number(voucher.maxDiscount) || 500000,
      validUntil: voucher.validUntil || '31/12/2026',
      usageLimit: Number(voucher.usageLimit) || 100,
      usedCount: 0,
      status: 'active',
      desc: voucher.desc || 'Chiến dịch khuyến mãi mới',
    };
    setVouchers([newVoucher, ...vouchers]);
    addAuditLog('Tạo mã giảm giá mới', `Quản lý tạo voucher ${newVoucher.code} (-${newVoucher.discountPercent}%)`);
    showToast('Tạo Voucher thành công', `Mã ${newVoucher.code} đã sẵn sàng áp dụng tại quầy và online!`);
  };

  // MGR-20: Broadcast Notification
  const broadcastNotification = (title, message, audience = 'all') => {
    addAuditLog('Gửi thông báo toàn hệ thống', `Phát thông báo Push/Email: "${title}" tới ${audience === 'all' ? 'Toàn bộ hội viên' : audience}`);
    showToast('Phát thông báo thành công', `Đã gửi thông báo "${title}" tới tất cả người dùng trong hệ thống!`);
  };

  // MGR-17 / REC-22 / MEM-26: Support Tickets
  const createSupportTicket = (ticket) => {
    const newTkt = {
      id: generateId('tkt'),
      memberId: ticket.memberId || currentUser.memberId || 'ELT-8924',
      memberName: ticket.memberName || currentUser.name || 'Nguyễn Minh Anh',
      phone: ticket.phone || currentUser.phone || '0987 654 321',
      category: ticket.category || 'Hỗ trợ chung',
      content: ticket.content,
      status: 'pending',
      assignedTo: 'Chưa phân công',
      createdAt: 'Vừa xong',
    };
    setSupportTickets([newTkt, ...supportTickets]);
    addAuditLog('Gửi khiếu nại / yêu cầu', `Hội viên gửi phản ánh: ${newTkt.content}`);
    showToast('Tiếp nhận yêu cầu', 'Yêu cầu của bạn đã được ghi nhận. Lễ tân và Quản lý sẽ xử lý sớm nhất!');
  };

  const assignSupportTicket = (ticketId, staffName) => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, assignedTo: staffName, status: 'in-progress' } : t))
    );
    showToast('Phân công xử lý', `Đã chỉ định ${staffName} phụ trách yêu cầu!`);
  };

  const resolveSupportTicket = (ticketId) => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
    );
    showToast('Đã đóng yêu cầu', 'Sự cố đã được giải quyết hoàn tất!');
  };

  // MGR-03: Export Members CSV
  const exportMembersCSV = () => {
    const headers = ['Mã Hội Viên', 'Họ Và Tên', 'Số Điện Thoại', 'Email', 'Hạng Thẻ', 'Trạng Thái', 'Ngày Gia Nhập', 'Hết Hạn'];
    const rows = members.map((m) => [m.memberId, m.name, m.phone, m.email, m.tier, m.status, m.joined, m.expires]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_sach_hoi_vien_EliteSports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog('Xuất file Excel hội viên', `Quản lý đã xuất danh sách ${members.length} hội viên ra file CSV`);
    showToast('Xuất file thành công', 'File CSV dữ liệu hội viên đã được tải xuống máy tính!');
  };

  const value = {
    // Roles & Session
    currentRole,
    switchRole,
    authenticateUser,
    currentUser,
    updateProfile,
    healthProfile,
    updateHealthProfile,
    activePlan,

    // Entities
    members,
    coaches: mockCoachesList,
    classes,
    checkIns,
    auditLogs,
    facilities,
    packages,
    sports,
    vouchers,
    retailInventory,
    lockers,
    supportTickets,
    refundRequests,
    coachReviews,
    paymentHistory,
    staffList,
    permissionsMatrix,
    aiSettings,

    // Toasts
    toasts,
    showToast,
    removeToast,
    addAuditLog,

    // Flow 1 Actions
    addMember,
    toggleMemberStatus,
    purchasePackage,
    freezePackage,
    transferPackage,
    issueRfidCard,

    // Flow 2 Actions
    bookClass,
    cancelClass,
    joinWaitlist,
    promoteFromWaitlist,
    createClassSession,
    toggleFacilityMaintenance,

    // Flow 3 Actions
    processPOSPayment,
    submitRefundRequest,
    approveRefund,

    // Flow 4 Actions
    checkInMember,
    assignLocker,
    releaseLocker,
    saveClassAttendance,
    checkInPTSession,
    assignHomework,
    addCoachReview,
    requestCoachLeave,

    // Flow 5 & 6
    updateAISettings,

    // Manager Tools
    addStaff,
    toggleStaffStatus,
    updatePermission,
    addVoucher,
    broadcastNotification,
    createSupportTicket,
    assignSupportTicket,
    resolveSupportTicket,
    exportMembersCSV,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
