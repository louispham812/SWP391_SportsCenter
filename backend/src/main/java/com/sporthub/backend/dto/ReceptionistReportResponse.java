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
        List<PaymentRecord> payments) {

    public record PaymentMethodTotal(String method, BigDecimal amount, long count) {
    }

    public record PaymentRecord(
            String paymentId,
            String memberName,
            BigDecimal amount,
            String method,
            String status,
            LocalDateTime createdAt) {
    }
}
