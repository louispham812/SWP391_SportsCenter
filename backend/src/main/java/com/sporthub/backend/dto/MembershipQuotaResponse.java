package com.sporthub.backend.dto;

import java.time.LocalDate;

/**
 * Response chứa thông tin quota của membership
 * Backend tính toán và trả về, Frontend chỉ hiển thị
 */
public record MembershipQuotaResponse(
        Long membershipId,
        Long packageId,
        String packageName,
        String packageType,  // VIP, PT, CLASS
        LocalDate startDate,
        LocalDate endDate,
        Integer initialQuota,
        Integer remainingQuota,
        Integer heldQuota,
        Integer usedQuota,
        Boolean canUseForBooking,  // Backend tính: còn quota và chưa hết hạn
        String message) {  // Message từ backend, vd: "Còn 5/12 buổi"

    // Constructor đơn giản hơn
    public MembershipQuotaResponse(
            Long membershipId,
            String packageName,
            Integer remainingQuota,
            Integer initialQuota) {
        this(membershipId, null, packageName, "VIP", null, null, 
             initialQuota, remainingQuota, 0, 0, remainingQuota > 0, 
             String.format("Còn %d/%d buổi", remainingQuota, initialQuota));
    }
}
