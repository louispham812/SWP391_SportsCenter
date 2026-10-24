package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record MemberAttendanceSummaryResponse(
        int totalSessions,
        int attendedSessions,
        int absentSessions,
        int pendingSessions,
        BigDecimal attendanceRate,
        List<MemberAttendanceRecordResponse> records,
        List<MemberCheckInResponse> gateCheckIns) {
}
