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
} from '../data/mockData';

const AppContext = createContext();

let idCounter = 1000;
const generateId = (prefix) => {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
};

export function AppProvider({ children }) {
  // 1. Current Active Role for testing
  const [currentRole, setCurrentRole] = useState('member'); // 'member' | 'receptionist' | 'coach' | 'admin'

  // 2. Data Collections
  const [members, setMembers] = useState(mockMembersList);
  const [classes, setClasses] = useState(mockClasses);
  const [checkIns, setCheckIns] = useState(mockCheckIns);
  const [auditLogs, setAuditLogs] = useState(mockAuditLogs);
  const [facilities] = useState(mockFacilities);
  const [packages] = useState(mockPackages);

  // 3. User State
  const [currentUser, setCurrentUser] = useState(mockUsers.member);

  // 4. Toast System
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
    }, 4000);
  };

  // Switch role handler
  const switchRole = (newRole) => {
    setCurrentRole(newRole);
    if (mockUsers[newRole]) {
      setCurrentUser(mockUsers[newRole]);
      showToast('Chuyển đổi phân hệ', `Đang thao tác với quyền: ${mockUsers[newRole].roleTitle}`, 'info');
    }
  };

  // ACTION: Member books a class (Flow 2)
  const bookClass = (classId) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          if (c.enrolled >= c.capacity) {
            showToast('Lớp học đã kín chỗ', 'Vui lòng chọn ca tập khác hoặc liên hệ hotline để đăng ký hàng chờ.', 'error');
            return c;
          }
          const updated = {
            ...c,
            enrolled: c.enrolled + 1,
            isBooked: true,
            students: [
              ...c.students,
              {
                id: currentUser.id || 'mem_01',
                name: currentUser.name,
                phone: currentUser.phone,
                status: 'present',
                note: 'Đăng ký qua ứng dụng hội viên',
              },
            ],
          };

          // Record Audit Log & Toast
          addAuditLog('Đặt lớp học', `Hội viên ${currentUser.name} đã đặt chỗ lớp: ${c.title}`);
          showToast('Đặt chỗ thành công', `Bạn đã giữ chỗ thành công lớp "${c.title}" (${c.time})!`, 'success');
          return updated;
        }
        return c;
      })
    );
  };

  // ACTION: Member cancels a class (Flow 2)
  const cancelClass = (classId) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          const updated = {
            ...c,
            enrolled: Math.max(0, c.enrolled - 1),
            isBooked: false,
            students: c.students.filter((st) => st.name !== currentUser.name),
          };
          addAuditLog('Hủy đặt chỗ', `Hội viên ${currentUser.name} đã hủy lớp: ${c.title}`);
          showToast('Hủy đặt chỗ thành công', `Đã hủy lịch học lớp "${c.title}". Vị trí đã được hoàn lại.`, 'info');
          return updated;
        }
        return c;
      })
    );
  };

  // ACTION: Receptionist checks in member (Flow 1 & 4)
  const checkInMember = (query) => {
    const matched = members.find(
      (m) =>
        m.phone.includes(query) ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.memberId.toLowerCase().includes(query.toLowerCase())
    );

    const checkInId = generateId('chk');
    const newLog = {
      id: checkInId,
      memberId: matched ? matched.memberId : `ELT-${1000 + (idCounter % 9000)}`,
      name: matched ? matched.name : query,
      tier: matched ? `${matched.tier} Member` : 'Silver Member',
      plan: matched && matched.status === 'expired' ? 'Gói Tập (Đã hết hạn)' : 'Gói Toàn Năng 5 Sao',
      time: '08:45 AM',
      method: 'Tra cứu quầy lễ tân',
      locker: `#${10 + (idCounter % 89)}`,
      status: matched && matched.status === 'expired' ? 'expired' : 'valid',
    };

    setCheckIns([newLog, ...checkIns]);
    addAuditLog('Check-in tại quầy', `Lễ tân đã check-in cho: ${newLog.name} (${newLog.memberId})`);
    if (newLog.status === 'expired') {
      showToast('Cảnh báo thẻ hết hạn', `Hội viên ${newLog.name} (${newLog.memberId}) đã hết hạn gói tập!`, 'warning');
    } else {
      showToast('Check-in thành công', `Hội viên: ${newLog.name} • Tủ đồ số ${newLog.locker} • Cửa đã mở`, 'success');
    }
    return newLog;
  };

  // ACTION: Add new member (Flow 1)
  const addMember = (newMem) => {
    const memId = generateId('mem');
    const created = {
      id: memId,
      memberId: `ELT-${1000 + (idCounter % 9000)}`,
      name: newMem.name,
      phone: newMem.phone,
      email: newMem.email || 'customer@example.com',
      tier: newMem.tier || 'Silver',
      status: 'active',
      joined: '19/11/2026',
      expires: '19/11/2027',
      enrolledClassesCount: 0,
      wallet: 0,
    };
    setMembers([created, ...members]);
    addAuditLog('Tạo thẻ hội viên mới', `Đăng ký hội viên mới: ${created.name} (${created.memberId})`);
    showToast('Tạo hội viên thành công', `Hội viên ${created.name} (${created.memberId}) đã được cấp thẻ ${created.tier}!`, 'success');
    return created;
  };

  // ACTION: Toggle member status (Flow 1)
  const toggleMemberStatus = (memberId) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const nextStatus = m.status === 'active' ? 'suspended' : 'active';
          showToast(
            'Cập nhật trạng thái hội viên',
            `${m.name}: Chuyển sang ${nextStatus === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}`,
            nextStatus === 'active' ? 'success' : 'warning'
          );
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
  };

  // ACTION: Coach saves attendance (Flow 4)
  const saveClassAttendance = (classId, updatedStudents, coachNote) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, students: updatedStudents, coachNote } : c
      )
    );
    addAuditLog('Lưu điểm danh lớp', `HLV đã lưu điểm danh lớp học #${classId}`);
    showToast('Đã lưu điểm danh & đánh giá', 'Dữ liệu chuyên cần và nhận xét của học viên đã được đồng bộ hóa!', 'success');
  };

  // Helper: Add Audit Log
  const addAuditLog = (action, target) => {
    const log = {
      id: generateId('log'),
      action,
      target,
      user: currentUser.name,
      time: 'Vừa xong',
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const value = {
    currentRole,
    switchRole,
    currentUser,
    members,
    coaches: mockCoachesList,
    classes,
    checkIns,
    auditLogs,
    facilities,
    packages,
    toasts,
    showToast,
    removeToast,
    bookClass,
    cancelClass,
    checkInMember,
    addMember,
    toggleMemberStatus,
    saveClassAttendance,
    addAuditLog,
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
