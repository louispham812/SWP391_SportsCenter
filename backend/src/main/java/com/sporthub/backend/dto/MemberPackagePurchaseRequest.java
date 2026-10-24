package com.sporthub.backend.dto;

public record MemberPackagePurchaseRequest(
        Long packageId,
        String paymentMethod) {

    public MemberPackagePurchaseRequest(Long packageId) {
        this(packageId, "SANDBOX");
    }
}
