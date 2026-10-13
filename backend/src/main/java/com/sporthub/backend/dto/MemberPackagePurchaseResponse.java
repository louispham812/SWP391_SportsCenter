package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MemberPackagePurchaseResponse(
        Long paymentId,
        Long membershipId,
        String packageName,
        BigDecimal amount,
        String paymentStatus,
        LocalDateTime createdAt) {
}
