package com.sporthub.backend.enums;

/**
 * Trạng thái gói membership theo DATABASE_SCHEMA_SPECIFICATION.md Section 2.4
 * 
 * Workflow:
 * PENDING_PAYMENT → thanh toán → PENDING_APPROVAL → Manager duyệt → ACTIVE
 *                                                   → Manager từ chối → REJECTED (hoàn 100%)
 * ACTIVE → hết hạn → EXPIRED
 * ACTIVE → hủy → CANCELLED
 */
public enum MembershipStatus {
    PENDING_PAYMENT,   // Chờ thanh toán
    PENDING_APPROVAL,  // Chờ duyệt (đã thanh toán)
    ACTIVE,            // Đang hoạt động
    EXPIRED,           // Hết hạn
    CANCELLED,         // Đã hủy
    REJECTED           // Bị từ chối (Manager không duyệt)
}
