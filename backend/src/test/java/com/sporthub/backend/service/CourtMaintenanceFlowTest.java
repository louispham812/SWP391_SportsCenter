package com.sporthub.backend.service;

import com.sporthub.backend.controller.EngagementController;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CourtMaintenanceFlowTest {

    private SportsCourtRepository courtRepository;
    private FacilityRepository facilityRepository;
    private PublicFacilityRepository publicFacilityRepository;
    private CourtMaintenanceRepository maintenanceRepository;
    private CourtBookingRepository courtBookingRepository;
    private BookingRepository bookingRepository;
    private ClassSessionRepository classSessionRepository;
    private UserRepository userRepository;
    private NotificationRepository notificationRepository;
    private AuditLogRepository auditLogRepository;
    private EngagementService engagementService;
    private FacilityCourtSyncService syncService;
    private EngagementController engagementController;
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        courtRepository = mock(SportsCourtRepository.class);
        facilityRepository = mock(FacilityRepository.class);
        publicFacilityRepository = mock(PublicFacilityRepository.class);
        maintenanceRepository = mock(CourtMaintenanceRepository.class);
        courtBookingRepository = mock(CourtBookingRepository.class);
        bookingRepository = mock(BookingRepository.class);
        classSessionRepository = mock(ClassSessionRepository.class);
        userRepository = mock(UserRepository.class);
        notificationRepository = mock(NotificationRepository.class);
        auditLogRepository = mock(AuditLogRepository.class);
        engagementService = mock(EngagementService.class);

        syncService = new FacilityCourtSyncService(
                facilityRepository,
                courtRepository,
                publicFacilityRepository,
                maintenanceRepository
        );

        engagementController = new EngagementController(
                mock(FeedbackRepository.class),
                bookingRepository,
                courtBookingRepository,
                classSessionRepository,
                userRepository,
                notificationRepository,
                auditLogRepository,
                maintenanceRepository,
                courtRepository,
                engagementService,
                mock(MemberCheckInRepository.class),
                mock(ReceptionPaymentRepository.class),
                mock(SystemSettingRepository.class),
                syncService
        );
    }

    @Test
    void testAutoCloseAndOpenCourtBasedOnMaintenanceTime() {
        Long courtId = 1L;
        SportsCourt court = new SportsCourt();
        court.setCourtId(courtId);
        court.setCourtName("Pickleball Court 01");
        court.setSportId(1L);
        court.setActive(true);

        when(courtRepository.findById(courtId)).thenReturn(Optional.of(court));

        // Case 1: Currently in maintenance (startTime <= now <= endTime)
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(true);
        syncService.syncCourtMaintenanceStatus(courtId);

        assertFalse(court.isActive(), "Court must be inactive during maintenance");
        verify(courtRepository).save(court);

        // Case 2: Maintenance completed or outside window
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(false);
        syncService.syncCourtMaintenanceStatus(courtId);

        assertTrue(court.isActive(), "Court must be restored to active after maintenance ends");
    }

    @Test
    void testManuallyDeactivatedCourtIsNotReopenedWhenNoMaintenance() {
        Long courtId = 2L;
        SportsCourt court = new SportsCourt();
        court.setCourtId(courtId);
        court.setCourtName("Pickleball Court 02");
        court.setSportId(1L);
        court.setActive(false); // Manually deactivated by admin

        when(courtRepository.findById(courtId)).thenReturn(Optional.of(court));
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(false);

        syncService.syncCourtMaintenanceStatus(courtId);

        assertFalse(court.isActive(), "Court manually deactivated by Admin must NOT be reopened by maintenance sync");
        verify(courtRepository, never()).save(court);
    }

    @Test
    void testFacilityDrivenMaintenanceReopensCourtAfterWindowEnds() {
        Long courtId = 1L;
        Long facilityId = 1L;
        SportsCourt court = new SportsCourt();
        court.setCourtId(courtId);
        court.setCourtName("Pickleball Court 01");
        court.setSportId(1L);
        court.setActive(true);

        Facility facility = new Facility();
        facility.setFacilityId(facilityId);
        facility.setSportId(1L);
        facility.setFacilityName("Pickleball Court 01");
        facility.setStatus("AVAILABLE");

        when(courtRepository.findById(courtId)).thenReturn(Optional.of(court));
        when(facilityRepository.findById(facilityId)).thenReturn(Optional.of(facility));

        // Facility marked as MAINTENANCE (deactivates court and tracks maintenance)
        syncService.syncFromFacility(facilityId, "MAINTENANCE");
        assertFalse(court.isActive(), "Court should be inactive when facility is in maintenance");
        assertTrue(syncService.isCourtLockedByMaintenance(courtId), "Court should be tracked as locked by maintenance");

        // Maintenance window ends, sync is triggered
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(false);
        syncService.syncCourtMaintenanceStatus(courtId);
        assertTrue(court.isActive(), "Court must be restored to active after facility maintenance window ends");
    }

    @Test
    void testMaintenanceWindowEndedDuringRestartReconstructsFromDurableStateAndReopens() {
        Long courtId = 1L;
        Long facilityId = 1L;
        LocalDateTime now = LocalDateTime.now();

        SportsCourt court = new SportsCourt();
        court.setCourtId(courtId);
        court.setCourtName("Pickleball Court 01");
        court.setSportId(1L);
        court.setActive(false); // Inactive from maintenance before restart

        Facility facility = new Facility();
        facility.setFacilityId(facilityId);
        facility.setSportId(1L);
        facility.setFacilityName("Pickleball Court 01");
        facility.setStatus("MAINTENANCE"); // Still in MAINTENANCE in DB

        CourtMaintenance pastMaintenance = CourtMaintenance.builder()
                .maintenanceId(999L)
                .courtId(courtId)
                .startTime(now.minusHours(2))
                .endTime(now.minusMinutes(30))
                .reason("Bảo trì định kỳ | [LOCKED_BY_MAINTENANCE]")
                .build();

        when(courtRepository.findById(courtId)).thenReturn(Optional.of(court));
        when(facilityRepository.findById(facilityId)).thenReturn(Optional.of(facility));
        when(maintenanceRepository.findByCourtId(courtId)).thenReturn(List.of(pastMaintenance));
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(false);

        // syncCourtMaintenanceStatus runs without courtId in in-memory set (simulating application restart)
        syncService.syncCourtMaintenanceStatus(courtId);

        assertTrue(court.isActive(), "Court must be reconstructed from durable state and reopened across restarts");
        assertEquals("AVAILABLE", facility.getStatus(), "Linked facility should be restored to AVAILABLE");
        assertTrue(pastMaintenance.getReason().contains("[REOPENED]"), "Maintenance record must be durable-marked as reopened");
    }

    @Test
    void testLegacyExpiredRecordWithoutLockMarkerDoesNotOverrideAdminManualDeactivation() {
        Long courtId = 2L;
        LocalDateTime now = LocalDateTime.now();

        SportsCourt court = new SportsCourt();
        court.setCourtId(courtId);
        court.setCourtName("Pickleball Court 02");
        court.setSportId(1L);
        court.setActive(false); // Inactive from admin manual deactivation

        // Legacy record from weeks ago without any lock marker
        CourtMaintenance legacyRecord = CourtMaintenance.builder()
                .maintenanceId(888L)
                .courtId(courtId)
                .startTime(now.minusDays(10))
                .endTime(now.minusDays(9))
                .reason("Bảo dưỡng định kỳ tháng trước")
                .build();

        when(courtRepository.findById(courtId)).thenReturn(Optional.of(court));
        when(maintenanceRepository.findByCourtId(courtId)).thenReturn(List.of(legacyRecord));
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(false);

        syncService.syncCourtMaintenanceStatus(courtId);

        assertFalse(court.isActive(), "Legacy expired record without lock marker must NOT reopen court");
        verify(courtRepository, never()).save(court);
    }

    @Test
    void testManualDeactivationShortlyAfterMaintenanceEndsIsNotOverridden() {
        Long courtId = 1L;
        Long facilityId = 1L;
        LocalDateTime now = LocalDateTime.now();

        SportsCourt court = new SportsCourt();
        court.setCourtId(courtId);
        court.setCourtName("Pickleball Court 01");
        court.setSportId(1L);
        court.setActive(true);

        Facility facility = new Facility();
        facility.setFacilityId(facilityId);
        facility.setSportId(1L);
        facility.setFacilityName("Pickleball Court 01");
        facility.setStatus("AVAILABLE");

        // Expired maintenance that already concluded and was marked [REOPENED]
        CourtMaintenance pastMaintenance = CourtMaintenance.builder()
                .maintenanceId(999L)
                .courtId(courtId)
                .startTime(now.minusHours(2))
                .endTime(now.minusMinutes(30))
                .reason("Bảo dưỡng định kỳ | [REOPENED]")
                .build();

        when(courtRepository.findById(courtId)).thenReturn(Optional.of(court));
        when(facilityRepository.findById(facilityId)).thenReturn(Optional.of(facility));
        when(maintenanceRepository.findByCourtId(courtId)).thenReturn(List.of(pastMaintenance));
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(false);

        // Admin manually deactivates the court shortly after
        syncService.syncFromCourt(courtId, false);
        assertFalse(court.isActive(), "Court should be deactivated by admin");

        // Maintenance scheduler runs
        syncService.syncCourtMaintenanceStatus(courtId);

        assertFalse(court.isActive(), "Manual deactivation by Admin must NOT be overridden by expired maintenance records");
    }

    @Test
    void testFacilityMaintenanceWithFutureScheduleCreatesActiveWindowAndStaysClosed() {
        Long courtId = 1L;
        Long facilityId = 1L;
        LocalDateTime now = LocalDateTime.now();

        SportsCourt court = new SportsCourt();
        court.setCourtId(courtId);
        court.setCourtName("Pickleball Court 01");
        court.setSportId(1L);
        court.setActive(true);

        Facility facility = new Facility();
        facility.setFacilityId(facilityId);
        facility.setSportId(1L);
        facility.setFacilityName("Pickleball Court 01");
        facility.setStatus("AVAILABLE");

        // Future maintenance schedule 10 days from now
        CourtMaintenance futureMaintenance = CourtMaintenance.builder()
                .maintenanceId(777L)
                .courtId(courtId)
                .startTime(now.plusDays(10))
                .endTime(now.plusDays(11))
                .reason("Bảo dưỡng định kỳ tương lai")
                .build();

        when(courtRepository.findById(courtId)).thenReturn(Optional.of(court));
        when(facilityRepository.findById(facilityId)).thenReturn(Optional.of(facility));
        when(maintenanceRepository.findByCourtId(courtId)).thenReturn(List.of(futureMaintenance));
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(false);

        // Facility set to MAINTENANCE
        syncService.syncFromFacility(facilityId, "MAINTENANCE");

        // Verify court is inactive
        assertFalse(court.isActive(), "Court must be inactive when facility is set to MAINTENANCE");
        // Verify a new active maintenance record covering now was saved
        verify(maintenanceRepository).save(argThat(m ->
                m.getReason() != null && m.getReason().contains("Bảo trì cơ sở bãi theo chỉ định Ban Quản Lý")
        ));
    }

    @Test
    void testPreExistingInactiveCourtIsNotReopenedWhenMaintenanceEnds() {
        Long courtId = 4L;
        SportsCourt court = new SportsCourt();
        court.setCourtId(courtId);
        court.setCourtName("Sân Bóng Đá 01");
        court.setSportId(5L);
        court.setActive(false); // Inactive from admin manual action prior to maintenance

        when(courtRepository.findById(courtId)).thenReturn(Optional.of(court));

        // Maintenance window is active
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(true);
        syncService.syncCourtMaintenanceStatus(courtId);
        assertFalse(court.isActive());

        // Maintenance window expires
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(false);
        syncService.syncCourtMaintenanceStatus(courtId);

        assertFalse(court.isActive(), "Court that was already inactive before maintenance must NOT be reopened");
        verify(courtRepository, never()).save(court);
    }

    @Test
    void testManualDeactivationDuringActiveMaintenancePreventsLaterReopen() {
        Long courtId = 1L;
        LocalDateTime now = LocalDateTime.now();

        SportsCourt court = new SportsCourt();
        court.setCourtId(courtId);
        court.setCourtName("Pickleball Court 01");
        court.setSportId(1L);
        court.setActive(true);

        CourtMaintenance activeMaintenance = CourtMaintenance.builder()
                .maintenanceId(111L)
                .courtId(courtId)
                .startTime(now.minusHours(1))
                .endTime(now.plusHours(1))
                .reason("Sơn lại sân | [LOCKED_BY_MAINTENANCE]")
                .build();

        when(courtRepository.findById(courtId)).thenReturn(Optional.of(court));
        when(maintenanceRepository.findByCourtId(courtId)).thenReturn(List.of(activeMaintenance));
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(true);

        // Maintenance is active
        syncService.syncCourtMaintenanceStatus(courtId);
        assertFalse(court.isActive());

        // Admin explicitly disables the court during active maintenance
        syncService.syncFromCourt(courtId, false);
        assertFalse(court.isActive());
        assertFalse(activeMaintenance.getReason().contains("[LOCKED_BY_MAINTENANCE]"), "Lock marker must be cleared on manual deactivation");

        // Maintenance expires later
        activeMaintenance.setEndTime(now.minusMinutes(1));
        when(maintenanceRepository.existsByCourtIdAndActiveAtTime(eq(courtId), any(LocalDateTime.class))).thenReturn(false);
        syncService.syncCourtMaintenanceStatus(courtId);

        assertFalse(court.isActive(), "Manual deactivation during maintenance must NOT be reopened when maintenance ends");
    }

    @Test
    void testExtendMaintenanceNotifiesConflictingBookings() {
        Long courtId = 1L;
        Long maintenanceId = 100L;
        LocalDateTime now = LocalDateTime.now();

        CourtMaintenance existing = CourtMaintenance.builder()
                .maintenanceId(maintenanceId)
                .courtId(courtId)
                .startTime(now.minusHours(1))
                .endTime(now.plusHours(1))
                .reason("Bảo dưỡng đèn")
                .build();

        when(maintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(existing));
        when(maintenanceRepository.save(any(CourtMaintenance.class))).thenAnswer(i -> i.getArgument(0));

        SportsCourt court = new SportsCourt();
        court.setCourtId(courtId);
        court.setCourtName("Pickleball Court 01");
        court.setActive(false);
        when(courtRepository.findById(courtId)).thenReturn(Optional.of(court));

        // Conflicting booking
        CourtBooking conflictingBooking = new CourtBooking();
        conflictingBooking.setCourtBookingId(555L);
        conflictingBooking.setCourtId(courtId);
        conflictingBooking.setMemberId(88L);
        conflictingBooking.setStartTime(now.plusHours(1).plusMinutes(15));
        conflictingBooking.setEndTime(now.plusHours(2).plusMinutes(15));
        conflictingBooking.setStatus("CONFIRMED");

        when(courtBookingRepository.findActiveOverlappingBookings(eq(courtId), any(), any()))
                .thenReturn(List.of(conflictingBooking));

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("1");
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(auth).getAuthorities();

        LocalDateTime newEndTime = now.plusHours(3);
        EngagementController.ExtendMaintenanceRequest req =
                new EngagementController.ExtendMaintenanceRequest(newEndTime, "Trễ tiến độ sửa đèn do mưa");

        Map<String, Object> result = engagementController.extendMaintenance(maintenanceId, req, auth);

        assertNotNull(result);
        assertEquals(1, result.get("affectedCount"), "Should detect 1 conflicting booking and notify member");
        assertEquals(newEndTime, existing.getEndTime());
        verify(engagementService).notifyUser(eq(88L), anyString(), contains("100%"), eq("MAINTENANCE_OVERLAP"));
    }

    @Test
    void testMaintenanceAffectedBookingAllowsCancelWithoutTwoHourRestriction() {
        Long courtBookingId = 99L;
        Long memberId = 10L;
        LocalDateTime now = LocalDateTime.now();

        CourtBooking booking = new CourtBooking();
        booking.setCourtBookingId(courtBookingId);
        booking.setMemberId(memberId);
        booking.setCourtId(1L);
        // Starting in 30 minutes (< 2 hours)
        booking.setStartTime(now.plusMinutes(30));
        booking.setEndTime(now.plusMinutes(90));
        booking.setStatus("CONFIRMED");
        booking.setAmountPaid(BigDecimal.valueOf(150000));
        booking.setPaymentId(12L);

        SportsCourt court = new SportsCourt();
        court.setCourtId(1L);
        court.setCourtName("Pickleball Court 01");
        court.setOpensAt(LocalTime.of(6, 0));
        court.setClosesAt(LocalTime.of(22, 0));

        PaymentTransaction payment = new PaymentTransaction();
        payment.setPaymentId(12L);
        payment.setAmount(BigDecimal.valueOf(150000));
        payment.setPaymentMethod("VNPAY");

        User user = User.builder().userId(memberId).fullName("Nguyen Van A").email("a@test.com").build();

        RefundRequestRepository refundRequestRepository = mock(RefundRequestRepository.class);
        PaymentTransactionRepository paymentTransactionRepository = mock(PaymentTransactionRepository.class);

        when(courtBookingRepository.findByIdForUpdate(courtBookingId)).thenReturn(Optional.of(booking));
        when(courtBookingRepository.findById(courtBookingId)).thenReturn(Optional.of(booking));
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court));
        when(userRepository.findById(memberId)).thenReturn(Optional.of(user));
        when(paymentTransactionRepository.findById(12L)).thenReturn(Optional.of(payment));
        when(refundRequestRepository.save(any(RefundRequest.class))).thenAnswer(i -> {
            RefundRequest r = i.getArgument(0);
            r.setRefundId(777L);
            return r;
        });

        // Maintenance covers the slot
        when(maintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(eq(1L), any(), any()))
                .thenReturn(true);

        bookingService = new BookingService(
                bookingRepository,
                classSessionRepository,
                userRepository,
                mock(PublicSportRepository.class),
                publicFacilityRepository,
                courtRepository,
                courtBookingRepository,
                maintenanceRepository,
                paymentTransactionRepository,
                mock(UserMembershipRepository.class),
                mock(MembershipPackageRepository.class),
                mock(MembershipService.class),
                mock(AuditLogService.class),
                mock(PaymentService.class),
                facilityRepository,
                null,
                refundRequestRepository,
                engagementService
        );

        // Should NOT throw 409 Conflict even though start time is only 30 mins away
        var response = bookingService.cancelCourtBooking(courtBookingId, memberId);
        assertNotNull(response);
        assertEquals("PENDING_APPROVAL", response.getStatus());
        assertEquals(BigDecimal.valueOf(150000), response.getRefundAmount());
    }

    @Test
    void testRescheduleCourtBookingSuccess() {
        Long courtBookingId = 10L;
        Long memberId = 5L;
        LocalDateTime now = LocalDateTime.now();

        CourtBooking booking = new CourtBooking();
        booking.setCourtBookingId(courtBookingId);
        booking.setMemberId(memberId);
        booking.setCourtId(1L);
        booking.setStartTime(now.plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0));
        booking.setEndTime(now.plusDays(1).withHour(11).withMinute(0).withSecond(0).withNano(0));
        booking.setStatus("CONFIRMED");

        SportsCourt court = new SportsCourt();
        court.setCourtId(1L);
        court.setCourtName("Pickleball Court 01");
        court.setOpensAt(LocalTime.of(6, 0));
        court.setClosesAt(LocalTime.of(22, 0));

        when(courtBookingRepository.findByIdForUpdate(courtBookingId)).thenReturn(Optional.of(booking));
        when(courtRepository.findById(1L)).thenReturn(Optional.of(court));
        when(courtBookingRepository.save(any(CourtBooking.class))).thenAnswer(i -> i.getArgument(0));

        // No maintenance and no other booking at new time
        when(maintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(eq(1L), any(), any()))
                .thenReturn(false);
        when(courtBookingRepository.existsConfirmedOverlapExcluding(eq(1L), eq(courtBookingId), any(), any()))
                .thenReturn(false);

        bookingService = new BookingService(
                bookingRepository,
                classSessionRepository,
                userRepository,
                mock(PublicSportRepository.class),
                publicFacilityRepository,
                courtRepository,
                courtBookingRepository,
                maintenanceRepository,
                mock(PaymentTransactionRepository.class),
                mock(UserMembershipRepository.class),
                mock(MembershipPackageRepository.class),
                mock(MembershipService.class),
                mock(AuditLogService.class),
                mock(PaymentService.class),
                facilityRepository,
                null,
                mock(RefundRequestRepository.class),
                engagementService
        );

        LocalDateTime newStart = now.plusDays(2).withHour(14).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime newEnd = now.plusDays(2).withHour(15).withMinute(0).withSecond(0).withNano(0);

        Map<String, Object> resp = bookingService.rescheduleCourtBooking(courtBookingId, memberId, 1L, newStart, newEnd);

        assertNotNull(resp);
        assertEquals(courtBookingId, resp.get("courtBookingId"));
        assertEquals(newStart, booking.getStartTime());
        assertEquals(newEnd, booking.getEndTime());
        verify(engagementService).notifyUser(eq(memberId), contains("Đổi lịch đặt sân thành công"), anyString(), eq("BOOKING_RESCHEDULE"));
    }
}
