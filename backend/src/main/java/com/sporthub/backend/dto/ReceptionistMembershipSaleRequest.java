package com.sporthub.backend.dto;

public record ReceptionistMembershipSaleRequest(
        Long memberId,
        Long packageId,
        String paymentMethod) {
}
