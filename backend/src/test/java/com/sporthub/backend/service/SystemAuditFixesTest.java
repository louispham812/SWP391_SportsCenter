package com.sporthub.backend.service;

import com.sporthub.backend.controller.CoachLeaveController;
import com.sporthub.backend.controller.CoachProfileController;
import com.sporthub.backend.controller.EngagementController;
import com.sporthub.backend.controller.FacilityManagementController;
import com.sporthub.backend.dto.CoachSendNoticeRequest;
import com.sporthub.backend.dto.CreateClassSessionRequest;
import com.sporthub.backend.dto.CreateLeaveRequest;
import com.sporthub.backend.dto.LeaveDecisionRequest;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SystemAuditFixesTest {

    private static UsernamePasswordAuthenticationToken auth(Long id, String role) {
        return new UsernamePasswordAuthenticationToken(
                String.valueOf(id), "", List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    @Test
    void lifecycleSkipsNoShowWhenOpenRefundRequestExistsAndMarksNoShowWhenRejected() {
        BookingRepository bookings = mock(BookingRepository.class);
        CourtBookingRepository courts = mock(CourtBookingRepository.class);
        ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        SportsCourtRepository sportsCourts = mock(SportsCourtRepository.class);
        UserMembershipRepository memberships = mock(UserMembershipRepository.class);
        MembershipService quotas = mock(MembershipService.class);
        PaymentService payments = mock(PaymentService.class);
        EngagementService engagement = mock(EngagementService.class);
        RefundRequestRepository refunds = mock(RefundRequestRepository.class);

        LocalDateTime pastEnd = LocalDateTime.now().minusMinutes(30);
        CourtBooking openRefundBooking = new CourtBooking();
        openRefundBooking.setCourtBookingId(11L);
        openRefundBooking.setCourtId(2L);
        openRefundBooking.setMemberId(50L);
        openRefundBooking.setPaymentId(101L);
        openRefundBooking.setStartTime(pastEnd.minusHours(1));
        openRefundBooking.setEndTime(pastEnd);
        openRefundBooking.setStatus("CONFIRMED");
        openRefundBooking.setUsesMembershipQuota(false);

        CourtBooking rejectedRefundBooking = new CourtBooking();
        rejectedRefundBooking.setCourtBookingId(12L);
        rejectedRefundBooking.setCourtId(2L);
        rejectedRefundBooking.setMemberId(51L);
        rejectedRefundBooking.setPaymentId(102L);
        rejectedRefundBooking.setStartTime(pastEnd.minusHours(1));
        rejectedRefundBooking.setEndTime(pastEnd);
        rejectedRefundBooking.setStatus("CONFIRMED");
        rejectedRefundBooking.setUsesMembershipQuota(false);

        when(courts.findByStatus("CONFIRMED")).thenReturn(List.of(openRefundBooking, rejectedRefundBooking));
        when(courts.findByIdForUpdate(11L)).thenReturn(Optional.of(openRefundBooking));
        when(courts.findByIdForUpdate(12L)).thenReturn(Optional.of(rejectedRefundBooking));
        when(refunds.findByTransactionId(101L))
                .thenReturn(List.of(RefundRequest.builder().transactionId(101L).status("PENDING_APPROVAL").build()));
        when(refunds.findByTransactionId(102L))
                .thenReturn(List.of(RefundRequest.builder().transactionId(102L).status("REJECTED").build()));
        when(bookings.findByStatus("CONFIRMED")).thenReturn(List.of());
        when(memberships.findByStatusIgnoreCase("ACTIVE")).thenReturn(List.of());
        when(memberships.findByStatusIgnoreCase("EXPIRED")).thenReturn(List.of());

        BookingLifecycleService lifecycle = new BookingLifecycleService(
                bookings, courts, sessions, sportsCourts, memberships, quotas, payments, engagement);
        ReflectionTestUtils.setField(lifecycle, "refundRequests", refunds);

        lifecycle.reconcile();

        assertEquals("CONFIRMED", openRefundBooking.getStatus());
        assertEquals("NO_SHOW", rejectedRefundBooking.getStatus());
        verify(courts, times(1)).save(rejectedRefundBooking);
        verify(courts, never()).save(openRefundBooking);
    }

    @Test
    @SuppressWarnings("unchecked")
    void engagementStaffPerformanceUsesPolicyStrictAttributionEquipmentLoansAndZeroDefaultRating() {
        FeedbackRepository feedbacks = mock(FeedbackRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        CourtBookingRepository courtBookings = mock(CourtBookingRepository.class);
        ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        UserRepository users = mock(UserRepository.class);
        NotificationRepository notifications = mock(NotificationRepository.class);
        AuditLogRepository auditLogs = mock(AuditLogRepository.class);
        CourtMaintenanceRepository maintenance = mock(CourtMaintenanceRepository.class);
        SportsCourtRepository courts = mock(SportsCourtRepository.class);
        EngagementService engagement = mock(EngagementService.class);
        MemberCheckInRepository checkIns = mock(MemberCheckInRepository.class);
        ReceptionPaymentRepository recPayments = mock(ReceptionPaymentRepository.class);
        SystemSettingRepository settings = mock(SystemSettingRepository.class);
        FacilityCourtSyncService sync = mock(FacilityCourtSyncService.class);
        EquipmentLoanRepository loans = mock(EquipmentLoanRepository.class);

        User coach = User.builder().userId(20L).fullName("HLV A").role("COACH").status("ACTIVE").build();
        User rec = User.builder().userId(30L).fullName("Le Tan B").role("RECEPTIONIST").status("ACTIVE").build();
        when(users.findAll()).thenReturn(List.of(coach, rec));

        ClassSession started = new ClassSession();
        started.setSessionId(1L);
        started.setCoachId(20L);
        started.setStatus("SCHEDULED");
        started.setStartTime(LocalDateTime.now().minusHours(2));
        started.setEndTime(LocalDateTime.now().minusHours(1));
        started.setPriceAmount(BigDecimal.valueOf(100000));

        ClassSession future = new ClassSession();
        future.setSessionId(2L);
        future.setCoachId(20L);
        future.setStatus("SCHEDULED");
        future.setStartTime(LocalDateTime.now().plusDays(1));
        future.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));
        future.setPriceAmount(BigDecimal.valueOf(500000));

        when(sessions.findByCoachIdOrderByStartTimeAsc(20L)).thenReturn(List.of(started, future));
        when(bookings.findBySessionIdInAndStatusIn(List.of(1L), List.of("BOOKED", "CONFIRMED")))
                .thenReturn(List.of(Booking.builder().bookingId(1L).build(), Booking.builder().bookingId(2L).build(),
                        Booking.builder().bookingId(3L).build()));
        when(feedbacks.findByCoachIdOrderByCreatedAtDesc(20L)).thenReturn(List.of());
        when(settings.findById("SYSTEM_POLICIES"))
                .thenReturn(Optional.of(new SystemSetting("SYSTEM_POLICIES", "{\"coachCommissionPercent\":40}", LocalDateTime.now())));

        ReceptionPayment unattributed = new ReceptionPayment();
        unattributed.setPaymentId(1);
        unattributed.setAmount(BigDecimal.valueOf(999000));
        unattributed.setPaymentStatus("COMPLETED");
        unattributed.setApprovedBy(null);

        ReceptionPayment recCash = new ReceptionPayment();
        recCash.setPaymentId(2);
        recCash.setAmount(BigDecimal.valueOf(300000));
        recCash.setPaymentStatus("COMPLETED");
        recCash.setApprovedBy(30);
        when(recPayments.findAll()).thenReturn(List.of(unattributed, recCash));

        EquipmentLoan returnedLoan = EquipmentLoan.builder()
                .loanId(5L).itemId(1L).memberId(99L).status("RETURNED")
                .rentalPricePerHour(BigDecimal.valueOf(50000))
                .rentalFee(BigDecimal.valueOf(50000)).recordedBy(30L).build();
        when(loans.findByStatusIgnoreCaseOrderByLoanedAtDesc("RETURNED")).thenReturn(List.of(returnedLoan));
        when(checkIns.findAll()).thenReturn(List.of());

        EngagementController controller = new EngagementController(
                feedbacks, bookings, courtBookings, sessions, users, notifications, auditLogs,
                maintenance, courts, engagement, checkIns, recPayments, settings, sync);
        ReflectionTestUtils.setField(controller, "equipmentLoanRepository", loans);

        Map<String, Object> perf = controller.getStaffPerformance(auth(1L, "MANAGER"));
        List<Map<String, Object>> coachRows = (List<Map<String, Object>>) perf.get("coaches");
        List<Map<String, Object>> recRows = (List<Map<String, Object>>) perf.get("receptionists");

        assertEquals(1, coachRows.size());
        assertEquals(1, coachRows.get(0).get("sessionsCount"));
        assertEquals(0.0, (Double) coachRows.get(0).get("averageRating"));

        assertEquals(1, recRows.size());
        assertEquals(2, recRows.get(0).get("posTransactionsCount"));
        assertEquals(0, BigDecimal.valueOf(350000).compareTo((BigDecimal) recRows.get(0).get("totalSalesAmount")));
    }

    @Test
    void engagementUpdateAiConfigPersistsOnlyWhitelistedKeys() {
        SystemSettingRepository settings = mock(SystemSettingRepository.class);
        EngagementService engagement = mock(EngagementService.class);
        when(settings.findById(anyString())).thenReturn(Optional.empty());

        EngagementController controller = new EngagementController(
                mock(FeedbackRepository.class), mock(BookingRepository.class), mock(CourtBookingRepository.class),
                mock(ClassSessionRepository.class), mock(UserRepository.class), mock(NotificationRepository.class),
                mock(AuditLogRepository.class), mock(CourtMaintenanceRepository.class), mock(SportsCourtRepository.class),
                engagement, mock(MemberCheckInRepository.class), mock(ReceptionPaymentRepository.class), settings, mock(FacilityCourtSyncService.class));

        controller.updateAiConfig(Map.of("ai_model", "gemini-2.5-flash", "arbitrary_key", "bad"), auth(1L, "MANAGER"));

        verify(settings).save(argThat(s -> "ai_model".equals(s.getSettingKey()) && "gemini-2.5-flash".equals(s.getSettingValue())));
        verify(settings, never()).save(argThat(s -> "arbitrary_key".equals(s.getSettingKey())));
    }

    @Test
    void coachSendNoticeRequiresAssignedNonCancelledStudentBooking() {
        UserRepository users = mock(UserRepository.class);
        ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        EngagementService engagement = mock(EngagementService.class);

        User coach = User.builder().userId(20L).fullName("HLV A").role("COACH").status("ACTIVE").build();
        User student = User.builder().userId(50L).fullName("HV X").role("MEMBER").status("ACTIVE").build();
        when(users.findById(20L)).thenReturn(Optional.of(coach));
        when(users.findById(50L)).thenReturn(Optional.of(student));

        ClassSession session = new ClassSession();
        session.setSessionId(10L);
        session.setCoachId(20L);
        session.setStatus("SCHEDULED");
        when(sessions.findByCoachIdOrderByStartTimeAsc(20L)).thenReturn(List.of(session));
        when(bookings.findByMemberId(50L)).thenReturn(List.of(
                Booking.builder().bookingId(1L).memberId(50L).sessionId(999L).status("CONFIRMED").build()));

        CoachProfileController controller = new CoachProfileController(
                users, sessions, bookings, mock(PublicSportRepository.class), mock(FeedbackRepository.class));
        ReflectionTestUtils.setField(controller, "engagementService", engagement);

        ResponseStatusException forbidden = assertThrows(ResponseStatusException.class, () ->
                controller.sendNotice(new CoachSendNoticeRequest(50L, null, "Nhac nho", "Den som"), auth(20L, "COACH")));
        assertEquals(403, forbidden.getStatusCode().value());

        when(bookings.findByMemberId(50L)).thenReturn(List.of(
                Booking.builder().bookingId(2L).memberId(50L).sessionId(10L).status("CONFIRMED").build()));
        var okRes = controller.sendNotice(new CoachSendNoticeRequest(50L, null, "Nhac nho", "Den som"), auth(20L, "COACH"));
        assertEquals(200, okRes.getStatusCode().value());
        verify(engagement).notifyUser(50L, "Nhac nho", "Den som", "COACH_NOTICE");
    }

    @Test
    void coachLeaveRejectsPastOverlappingRequestsAndIntraBatchReplacementOverlap() {
        CoachLeaveRequestRepository leaves = mock(CoachLeaveRequestRepository.class);
        UserRepository users = mock(UserRepository.class);
        ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        EngagementService engagement = mock(EngagementService.class);

        User coach = User.builder().userId(20L).fullName("HLV A").role("COACH").status("ACTIVE").build();
        User replacement = User.builder().userId(21L).fullName("HLV B").role("COACH").status("ACTIVE").build();
        when(users.findById(20L)).thenReturn(Optional.of(coach));
        when(users.findByIdForUpdate(21L)).thenReturn(Optional.of(replacement));

        CoachLeaveController controller = new CoachLeaveController(leaves, users, sessions, bookings, engagement);

        ResponseStatusException pastEx = assertThrows(ResponseStatusException.class, () ->
                controller.createLeaveRequest(
                        new CreateLeaveRequest("SICK_LEAVE", LocalDate.now().minusDays(1), LocalDate.now(), "Om"),
                        auth(20L, "COACH")));
        assertEquals(400, pastEx.getStatusCode().value());

        LocalDate d1 = LocalDate.now().plusDays(3);
        when(leaves.findByCoachIdOrderByCreatedAtDesc(20L)).thenReturn(List.of(
                CoachLeaveRequest.builder().requestId(1L).coachId(20L).status("PENDING")
                        .startDate(d1).endDate(d1.plusDays(2)).build()));
        ResponseStatusException overlapEx = assertThrows(ResponseStatusException.class, () ->
                controller.createLeaveRequest(
                        new CreateLeaveRequest("PERSONAL_LEAVE", d1.plusDays(1), d1.plusDays(3), "Viec rieng"),
                        auth(20L, "COACH")));
        assertEquals(409, overlapEx.getStatusCode().value());

        LocalDate leaveDay = LocalDate.now().plusDays(5);
        CoachLeaveRequest pendingLeave = CoachLeaveRequest.builder()
                .requestId(9L).coachId(20L).coachName("HLV A").status("PENDING")
                .startDate(leaveDay).endDate(leaveDay).build();
        when(leaves.findByIdForUpdate(9L)).thenReturn(Optional.of(pendingLeave));

        ClassSession s1 = new ClassSession();
        s1.setSessionId(101L); s1.setCoachId(20L); s1.setClassName("Lop 1"); s1.setStatus("SCHEDULED");
        s1.setStartTime(leaveDay.atTime(9, 0)); s1.setEndTime(leaveDay.atTime(10, 0));
        ClassSession s2 = new ClassSession();
        s2.setSessionId(102L); s2.setCoachId(20L); s2.setClassName("Lop 2"); s2.setStatus("SCHEDULED");
        s2.setStartTime(leaveDay.atTime(9, 30)); s2.setEndTime(leaveDay.atTime(10, 30));
        when(sessions.findAll()).thenReturn(List.of(s1, s2));
        when(sessions.existsOverlappingSessionForCoach(eq(21L), any(), any())).thenReturn(false);

        ResponseStatusException batchOverlapEx = assertThrows(ResponseStatusException.class, () ->
                controller.decideLeaveRequest(9L, new LeaveDecisionRequest(true, 21L, "Duyet"), auth(1L, "MANAGER")));
        assertEquals(409, batchOverlapEx.getStatusCode().value());
    }

    @Test
    void facilityManagementRejectsCreatingClassOverlappingCourtMaintenance() {
        FacilityRepository facilities = mock(FacilityRepository.class);
        SportRepository sports = mock(SportRepository.class);
        UserRepository users = mock(UserRepository.class);
        ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        FacilityCourtSyncService sync = mock(FacilityCourtSyncService.class);
        CourtMaintenanceRepository maintenance = mock(CourtMaintenanceRepository.class);

        Facility facility = new Facility(1L, "San Pickleball 1", 1L, 12, "AVAILABLE");
        Sport sport = new Sport();
        sport.setSportId(1L);
        sport.setSportName("Pickleball");
        User coach = User.builder().userId(20L).role("COACH").status("ACTIVE").coachedSports(Set.of(sport)).build();

        when(facilities.findById(1L)).thenReturn(Optional.of(facility));
        when(sports.findById(1L)).thenReturn(Optional.of(sport));
        when(users.findById(20L)).thenReturn(Optional.of(coach));
        when(sessions.findByCoachIdOrderByStartTimeAsc(20L)).thenReturn(List.of());
        when(sessions.findAll()).thenReturn(List.of());
        when(sync.getCourtIdsForFacility(1L, 1L, "San Pickleball 1")).thenReturn(List.of(77L));
        when(maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(eq(77L), any(), any())).thenReturn(true);

        FacilityManagementController controller = new FacilityManagementController(
                facilities, sports, users, sessions, mock(BookingRepository.class), mock(EngagementService.class),
                mock(PaymentTransactionRepository.class), mock(PublicFacilityRepository.class), mock(SportsCourtRepository.class), sync);
        ReflectionTestUtils.setField(controller, "courtMaintenanceRepository", maintenance);

        LocalDateTime start = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0);
        ResponseStatusException conflict = assertThrows(ResponseStatusException.class, () ->
                controller.createClassSession(
                        new CreateClassSessionRequest("Pickleball Morning", 1L, 20L, 1L, start, start.plusHours(1), 1, 10, BigDecimal.valueOf(100000)),
                        auth(1L, "MANAGER")));
        assertEquals(409, conflict.getStatusCode().value());
    }

    @Test
    void receptionistCannotEnrollPendingOrLockedMemberInClass() {
        UserRepository users = mock(UserRepository.class);
        User pendingMember = User.builder().userId(50L).role("MEMBER").status("PENDING").build();
        when(users.findById(50L)).thenReturn(Optional.of(pendingMember));

        BookingService bookingService = new BookingService(
                mock(BookingRepository.class), mock(ClassSessionRepository.class), users,
                mock(PublicSportRepository.class), mock(PublicFacilityRepository.class),
                mock(SportsCourtRepository.class), mock(CourtBookingRepository.class),
                mock(CourtMaintenanceRepository.class), mock(PaymentTransactionRepository.class),
                mock(UserMembershipRepository.class), mock(MembershipPackageRepository.class),
                mock(MembershipService.class), mock(AuditLogService.class));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                bookingService.enrollMemberInClassByReceptionist(10L, 50L, "CASH", false, null, 3L, "RECEPTIONIST"));
        assertEquals(409, ex.getStatusCode().value());
    }
}
