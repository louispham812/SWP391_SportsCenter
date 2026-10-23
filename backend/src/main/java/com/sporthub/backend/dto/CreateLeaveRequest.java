package com.sporthub.backend.dto;

import java.time.LocalDate;

public record CreateLeaveRequest(
        String leaveType,
        LocalDate startDate,
        LocalDate endDate,
        String reason) {
}
