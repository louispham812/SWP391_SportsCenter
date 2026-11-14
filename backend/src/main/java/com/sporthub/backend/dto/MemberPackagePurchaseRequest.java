package com.sporthub.backend.dto;

public record MemberPackagePurchaseRequest(
        Long packageId,
        String paymentMethod,
        String voucherCode) {

    public MemberPackagePurchaseRequest(Long packageId, String paymentMethod) {
        this(packageId, paymentMethod, null);
    }

    public MemberPackagePurchaseRequest(Long packageId) {
        this(packageId, "VNPAY", null);
    }
}
