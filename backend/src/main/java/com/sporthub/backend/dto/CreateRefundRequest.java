package com.sporthub.backend.dto;

import java.math.BigDecimal;

public record CreateRefundRequest(
        Long transactionId,
        String referenceCode,
        String bookingDescription,
        BigDecimal refundAmount,
        String reason,
        String bankName,
        String bankAccount,
        String accountHolder) {
}
