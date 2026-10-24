package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RefundRequestDTO(
        Long refundId,
        Long memberId,
        String memberName,
        String phone,
        Long transactionId,
        String referenceCode,
        String bookingDescription,
        BigDecimal refundAmount,
        String reason,
        String bankName,
        String bankAccount,
        String accountHolder,
        String status,
        Long approvedBy,
        String decisionNote,
        LocalDateTime createdAt) {
}
