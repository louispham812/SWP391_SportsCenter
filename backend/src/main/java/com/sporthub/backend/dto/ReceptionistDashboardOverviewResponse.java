package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ReceptionistDashboardOverviewResponse(
        LocalDate today,
        BigDecimal todayRevenue,
        long completedTransactionsCount,
        long todayCheckInsCount,
        long validCheckInsCount,
        long rejectedCheckInsCount,
        long newMembersTodayCount,
        long todayClassesCount,
        long activeLoansCount,
        List<RecentCheckInItem> recentCheckIns,
        List<TodayClassItem> todayClasses,
        List<ReceptionistReportResponse.PaymentMethodTotal> paymentMethods
) {
    public record RecentCheckInItem(
            Long checkInId,
            Long memberId,
            String memberName,
            String memberPhone,
            String memberAvatar,
            LocalDateTime checkedInAt,
            String result
    ) {}

    public record TodayClassItem(
            Long sessionId,
            String className,
            Long coachId,
            String coachName,
            String coachAvatar,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer maxSlots,
            Integer bookedSlots,
            String status
    ) {}
}
