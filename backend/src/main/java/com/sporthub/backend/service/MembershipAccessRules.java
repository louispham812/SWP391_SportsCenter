package com.sporthub.backend.service;

import java.time.LocalDateTime;
import java.time.LocalTime;

public final class MembershipAccessRules {
    private MembershipAccessRules() {}

    public static boolean permits(String accessType, LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || !end.isAfter(start)) return false;
        return switch (accessType == null ? "" : accessType) {
            case "ALL_DAY" -> true;
            case "OFF_PEAK" -> start.toLocalDate().equals(end.toLocalDate())
                    && !start.toLocalTime().isBefore(LocalTime.of(8, 0))
                    && !end.toLocalTime().isAfter(LocalTime.of(16, 0));
            case "PEAK" -> start.toLocalDate().equals(end.toLocalDate())
                    && !start.toLocalTime().isBefore(LocalTime.of(17, 0))
                    && !end.toLocalTime().isAfter(LocalTime.of(21, 0));
            default -> false;
        };
    }
}
