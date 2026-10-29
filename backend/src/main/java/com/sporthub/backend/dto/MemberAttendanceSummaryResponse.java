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
        List<MemberCheckInResponse> gateCheckIns,
        List<MemberCourtBookingAttendanceResponse> courtBookings) {

    public MemberAttendanceSummaryResponse(
            int totalSessions,
            int attendedSessions,
            int absentSessions,
            int pendingSessions,
            BigDecimal attendanceRate,
            List<MemberAttendanceRecordResponse> records,
            List<MemberCheckInResponse> gateCheckIns) {
        this(totalSessions, attendedSessions, absentSessions, pendingSessions, attendanceRate, records, gateCheckIns, List.of());
    }
}
