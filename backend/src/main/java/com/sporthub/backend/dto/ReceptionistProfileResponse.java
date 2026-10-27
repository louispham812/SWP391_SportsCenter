package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ReceptionistProfileResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        String avatar,
        String rfidCode,
        String staffCode,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String emergencyContactName,
        String emergencyContactPhone,
        String role,
        String roleTitle,
        String status,
        LocalDateTime createdAt,
        StaffStats shiftStats
) {
    public record StaffStats(
            long totalCheckInsHandled,
            long totalSalesHandled,
            BigDecimal totalRevenueCollected
    ) {}
}
