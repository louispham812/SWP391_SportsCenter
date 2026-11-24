package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ReceptionistReportResponse(
        LocalDate date,
        BigDecimal totalRevenue,
        long completedPayments,
        long newMembers,
        List<PaymentMethodTotal> paymentMethods,
        List<PaymentRecord> payments,
        String period,
        LocalDate startDate,
        LocalDate endDate) {

    public ReceptionistReportResponse(
            LocalDate date,
            BigDecimal totalRevenue,
            long completedPayments,
            long newMembers,
            List<PaymentMethodTotal> paymentMethods,
            List<PaymentRecord> payments) {
        this(date, totalRevenue, completedPayments, newMembers, paymentMethods, payments, "day", date, date);
    }

    public record PaymentMethodTotal(String method, BigDecimal amount, long count) {
    }

    public record PaymentRecord(
            String paymentId,
            String memberName,
            BigDecimal amount,
            String method,
            String status,
            LocalDateTime createdAt,
            String phone,
            String email,
            String type,
            String description,
            String processedByName) {

        public PaymentRecord(
                String paymentId,
                String memberName,
                BigDecimal amount,
                String method,
                String status,
                LocalDateTime createdAt,
                String phone,
                String email,
                String type,
                String description) {
            this(paymentId, memberName, amount, method, status, createdAt, phone, email, type, description, null);
        }

        public PaymentRecord(
                String paymentId,
                String memberName,
                BigDecimal amount,
                String method,
                String status,
                LocalDateTime createdAt) {
            this(paymentId, memberName, amount, method, status, createdAt, null, null, "Dịch vụ", "Thanh toán dịch vụ", null);
        }
    }
}
