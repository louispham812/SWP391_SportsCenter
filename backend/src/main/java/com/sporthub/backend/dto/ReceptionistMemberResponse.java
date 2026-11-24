package com.sporthub.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ReceptionistMemberResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        String status,
        LocalDateTime createdAt,
        String emergencyContactName,
        String emergencyContactPhone,
        String avatar,
        String rfidCode,
        String activePackageName,
        LocalDate activePackageEndDate,
        Integer remainingQuotaSessions,
        List<ActivePackageSummary> activePackages) {

    public record ActivePackageSummary(
            Long membershipId,
            Long packageId,
            String packageName,
            LocalDate startDate,
            LocalDate endDate,
            Integer remainingQuotaSessions,
            Integer remainingQuotaCourts) {
    }

    public ReceptionistMemberResponse(Long userId, String fullName, String email, String phone, String status, LocalDateTime createdAt) {
        this(userId, fullName, email, phone, status, createdAt, null, null, null, null, null, null, 0, List.of());
    }

    public ReceptionistMemberResponse(
            Long userId,
            String fullName,
            String email,
            String phone,
            String status,
            LocalDateTime createdAt,
            String emergencyContactName,
            String emergencyContactPhone) {
        this(userId, fullName, email, phone, status, createdAt, emergencyContactName, emergencyContactPhone,
                null, null, null, null, 0, List.of());
    }
}
