package com.sporthub.backend.enums;

/**
 * Trạng thái thanh toán theo DATABASE_SCHEMA_SPECIFICATION.md Section 2.9
 */
public enum PaymentStatus {
    UNPAID,    // Chưa thanh toán
    PAID,      // Đã thanh toán
    REFUNDED   // Đã hoàn tiền
}
