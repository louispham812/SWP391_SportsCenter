package com.sporthub.backend.dto;

import java.math.BigDecimal;

public record ManagerPackageRequest(
        String name,
        Long sportId,
        BigDecimal price,
        Integer durationDays,
        String accessType,
        String description,
        String status,
        Integer quotaSessions,
        Integer quotaCourts,
        String membershipTier) {
    public ManagerPackageRequest(String name, Long sportId, BigDecimal price, Integer durationDays,
            String accessType, String description, String status, Integer quotaSessions, Integer quotaCourts,
            com.sporthub.backend.enums.MembershipTier membershipTier) {
        this(name, sportId, price, durationDays, accessType, description, status, quotaSessions, quotaCourts,
                membershipTier == null ? null : membershipTier.name());
    }
    public ManagerPackageRequest(String name, Long sportId, BigDecimal price, Integer durationDays,
            String accessType, String description, String status, Integer quotaSessions, Integer quotaCourts) {
        this(name, sportId, price, durationDays, accessType, description, status, quotaSessions, quotaCourts, (String) null);
    }
    public ManagerPackageRequest(
            String name,
            Long sportId,
            BigDecimal price,
            Integer durationDays,
            String accessType,
            String description,
            String status) {
        this(name, sportId, price, durationDays, accessType, description, status, null, null, (String) null);
    }
}
