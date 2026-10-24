package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CoachIncomeResponse(
        BigDecimal totalIncome,
        BigDecimal totalRevenue,
        int totalSessions,
        int totalStudents,
        BigDecimal commissionRate,
        List<SessionIncomeDetail> sessions) {

    public record SessionIncomeDetail(
            Long sessionId,
            String className,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String status,
            int studentsCount,
            BigDecimal priceAmount,
            BigDecimal sessionRevenue,
            BigDecimal coachCommission) {
    }
}
