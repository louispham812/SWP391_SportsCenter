package com.sporthub.backend.dto;

import java.math.BigDecimal;

public record ManagerPackageRequest(
        String name,
        Long sportId,
        BigDecimal price,
        Integer durationDays,
        String accessType,
        String description,
        String status) {
}
