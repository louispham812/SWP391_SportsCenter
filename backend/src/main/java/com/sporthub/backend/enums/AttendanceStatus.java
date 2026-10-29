package com.sporthub.backend.enums;

/**
 * Trạng thái điểm danh theo DATABASE_SCHEMA_SPECIFICATION.md Section 5.4
 * 
 * Quy tắc trừ quota:
 * - PENDING: Chưa điểm danh (held quota)
 * - PRESENT: Có mặt → trừ quota (held → used)
 * - EXCUSED_ABSENCE: Vắng có phép → hoàn quota nếu gói chưa hết hạn (held → remaining)
 * - UNEXCUSED_ABSENCE: Vắng không phép → vẫn trừ quota (held → used)
 * 
 * Quyền hạn:
 * - Coach: Tạo và sửa điểm danh lớp của mình (COA-05)
 * - Receptionist: Sửa tất cả điểm danh (REC-26)
 * - Manager: Full access (MGR-25)
 */
public enum AttendanceStatus {
    PENDING,              // Chưa điểm danh
    PRESENT,              // Có mặt
    EXCUSED_ABSENCE,      // Vắng có phép
    UNEXCUSED_ABSENCE,    // Vắng không phép
    ABSENT                // Vắng mặt (tương thích dữ liệu seed)
}
