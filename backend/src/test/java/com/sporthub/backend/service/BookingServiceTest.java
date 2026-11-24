package com.sporthub.backend.service;

import static org.mockito.Mockito.lenient;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.web.server.ResponseStatusException;

import com.sporthub.backend.constants.PaymentConstants;
import com.sporthub.backend.dto.BookingConfirmationResponse;
import com.sporthub.backend.dto.CancelBookingResponse;
import com.sporthub.backend.dto.CheckoutRequest;
import com.sporthub.backend.dto.CoachScheduleEntryResponse;
import com.sporthub.backend.dto.ReceptionistClassResponse;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.CourtBooking;
import com.sporthub.backend.entity.CourtMaintenance;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.PublicFacility;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.entity.SportsCourt;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.enums.AttendanceStatus;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.repository.CourtMaintenanceRepository;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.PublicFacilityRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.RefundRequestRepository;
import com.sporthub.backend.repository.SportsCourtRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;

class BookingServiceTest {

    private final BookingRepository bookingRepository = mock(BookingRepository.class);
    private final ClassSessionRepository classSessionRepository = mock(ClassSessionRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final PublicSportRepository publicSportRepository = mock(PublicSportRepository.class);
    private final PublicFacilityRepository publicFacilityRepository = mock(PublicFacilityRepository.class);
    private final SportsCourtRepository sportsCourtRepository = mock(SportsCourtRepository.class);
    private final CourtBookingRepository courtBookingRepository = mock(CourtBookingRepository.class);
    private final CourtMaintenanceRepository courtMaintenanceRepository = mock(CourtMaintenanceRepository.class);
    private final PaymentTransactionRepository paymentTransactionRepository = mock(PaymentTransactionRepository.class);
    private final UserMembershipRepository userMembershipRepository = mock(UserMembershipRepository.class);
    private final MembershipPackageRepository membershipPackageRepository = mock(MembershipPackageRepository.class);
    private final MembershipService membershipService = mock(MembershipService.class);
    private final PaymentService paymentService = mock(PaymentService.class);
    private final EngagementService engagementService = mock(EngagementService.class);
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        when(paymentService.createPayment(any(), any(), org.mockito.ArgumentMatchers.nullable(String.class), any(), any()))
            .thenAnswer(i -> new PaymentService(paymentTransactionRepository).createPayment(i.getArgument(0), i.getArgument(1), i.getArgument(2), i.getArgument(3), i.getArgument(4)));
        bookingService = new BookingService(
                bookingRepository,
                classSessionRepository,
                userRepository,
                publicSportRepository,
                publicFacilityRepository,
                sportsCourtRepository,
                courtBookingRepository,
                courtMaintenanceRepository,
                paymentTransactionRepository,
                userMembershipRepository,
                membershipPackageRepository,
                membershipService,
                mock(AuditLogService.class),
                paymentService,
                null,
                mock(RefundRequestRepository.class),
                engagementService);
    }

    @Test
    void classCheckoutCreatesPaidBookingAndStoresPrice() {
        ClassSession session = session(2);
        User member = User.builder().userId(11L).role("MEMBER").status("ACTIVE").build();
        PublicSport sport = sport(4L, "Pickleball");
        PublicFacility facility = facility(5L, "Court hall");
        User coach = User.builder().userId(8L).fullName("Coach").build();
        lenient().when(userRepository.findById(11L)).thenReturn(Optional.of(member));
        lenient().when(userRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(member));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(bookingRepository.existsByMemberIdAndSessionIdAndStatusIn(eq(11L), eq(22L), anyList()))
                .thenReturn(false);
        when(bookingRepository.countBySessionIdAndStatusIn(eq(22L), anyList())).thenReturn(0L, 1L);
        when(publicSportRepository.findById(4L)).thenReturn(Optional.of(sport));
        when(publicFacilityRepository.findById(5L)).thenReturn(Optional.of(facility));
        lenient().when(userRepository.findById(8L)).thenReturn(Optional.of(coach));
        lenient().when(userRepository.findByIdForUpdate(8L)).thenReturn(Optional.of(coach));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction payment = invocation.getArgument(0);
            payment.setPaymentId(77L);
            return payment;
        });
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setBookingId(88L);
            return booking;
        });

        BookingConfirmationResponse response = bookingService.checkout(
                11L,
                new CheckoutRequest("CLASS", 22L, null, null, PaymentConstants.METHOD_VNPAY));

        assertEquals("CLASS", response.bookingType());
        assertEquals(88L, response.bookingId());
        assertEquals(new BigDecimal("275000"), response.amountPaid());
        assertEquals("PENDING", response.paymentStatus());
        verify(classSessionRepository).save(session);
        verify(paymentTransactionRepository).save(any(PaymentTransaction.class));
    }

    @Test
    void classCheckoutRejectsFullClassWithoutCreatingPayment() {
        ClassSession session = session(1);
        lenient().when(userRepository.findById(11L)).thenReturn(Optional.of(User.builder().userId(11L).role("MEMBER").status("ACTIVE").build()));
        lenient().when(userRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(User.builder().userId(11L).role("MEMBER").status("ACTIVE").build()));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(bookingRepository.countBySessionIdAndStatusIn(eq(22L), anyList())).thenReturn(1L);

        assertThrows(ResponseStatusException.class, () -> bookingService.checkout(
                11L,
                new CheckoutRequest("CLASS", 22L, null, null, PaymentConstants.METHOD_VNPAY)));
        verify(paymentTransactionRepository, never()).save(any(PaymentTransaction.class));
    }

    @Test
    void coachScheduleReturnsAssignedDatabaseSessionsForRequestedWeek() {
        LocalDate weekStart = LocalDate.of(2026, 10, 12);
        ClassSession session = session(4);
        session.setSessionId(22L);
        session.setStartTime(weekStart.plusDays(1).atTime(19, 30));
        session.setEndTime(weekStart.plusDays(1).atTime(21, 0));
        when(classSessionRepository
                .findByCoachIdAndStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(
                        8L, weekStart.atStartOfDay(), weekStart.plusDays(7).atStartOfDay()))
                .thenReturn(List.of(session));
        when(publicSportRepository.findAllById(List.of(4L))).thenReturn(List.of(sport(4L, "Pickleball")));
        when(publicFacilityRepository.findAllById(List.of(5L))).thenReturn(List.of(facility(5L, "Sân Pro 01")));
        when(bookingRepository.findBySessionIdInAndStatusIn(List.of(22L), List.of("BOOKED", "CONFIRMED")))
                .thenReturn(List.of(
                        Booking.builder().sessionId(22L).status("BOOKED").build(),
                        Booking.builder().sessionId(22L).status("CONFIRMED").build()));

        List<CoachScheduleEntryResponse> result = bookingService.getCoachSchedule(8L, weekStart);

        assertEquals(1, result.size());
        assertEquals("Class session", result.get(0).className());
        assertEquals("Pickleball", result.get(0).sportName());
        assertEquals("Sân Pro 01", result.get(0).facilityName());
        assertEquals(2, result.get(0).bookedSlots());
        assertEquals(4, result.get(0).maxSlots());
        verify(classSessionRepository)
                .findByCoachIdAndStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(
                        8L, weekStart.atStartOfDay(), weekStart.plusDays(7).atStartOfDay());
    }

    @Test
    void coachStudentsIncludesOnlyActiveBookingsInTheCoachsAssignedClasses() {
        ClassSession assignedSession = session(4);
        assignedSession.setSessionId(22L);
        assignedSession.setClassName("Coach class");
        ClassSession cancelledSession = session(4);
        cancelledSession.setSessionId(23L);
        cancelledSession.setStatus("CANCELLED");
        when(classSessionRepository.findByCoachIdOrderByStartTimeAsc(8L))
                .thenReturn(List.of(assignedSession, cancelledSession));
        when(bookingRepository.findBySessionIdInAndStatusIn(List.of(22L), List.of("BOOKED", "CONFIRMED")))
                .thenReturn(List.of(
                        Booking.builder()
                                .bookingId(100L)
                                .memberId(11L)
                                .sessionId(22L)
                                .bookingTime(LocalDateTime.now())
                                .status("BOOKED")
                                .attendanceStatus(AttendanceStatus.PENDING)
                                .build()));
        when(userRepository.findAllById(List.of(11L)))
                .thenReturn(List.of(User.builder()
                        .userId(11L)
                        .fullName("Registered student")
                        .phone("0900000000")
                        .build()));

        var result = bookingService.getCoachStudents(8L);

        assertEquals(1, result.size());
        assertEquals(11L, result.get(0).memberId());
        assertEquals("Registered student", result.get(0).memberName());
        assertEquals(22L, result.get(0).sessionId());
        assertEquals("Coach class", result.get(0).className());
        verify(classSessionRepository).findByCoachIdOrderByStartTimeAsc(8L);
        verify(bookingRepository).findBySessionIdInAndStatusIn(List.of(22L), List.of("BOOKED", "CONFIRMED"));
    }

    @Test
    void receptionistScheduleReturnsClassesWithCoachAndBookingDetails() {
        LocalDate weekStart = LocalDate.of(2026, 10, 12);
        ClassSession session = session(4);
        session.setSessionId(22L);
        session.setStartTime(weekStart.plusDays(1).atTime(19, 30));
        session.setEndTime(weekStart.plusDays(1).atTime(21, 0));
        when(classSessionRepository
                .findByStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(
                        weekStart.atStartOfDay(), weekStart.plusDays(7).atStartOfDay()))
                .thenReturn(List.of(session));
        when(publicSportRepository.findAllById(List.of(4L))).thenReturn(List.of(sport(4L, "Pickleball")));
        when(publicFacilityRepository.findAllById(List.of(5L))).thenReturn(List.of(facility(5L, "Sân Pro 01")));
        when(userRepository.findAllById(List.of(8L)))
                .thenReturn(List.of(User.builder().userId(8L).fullName("Huấn luyện viên").build()));
        when(bookingRepository.findBySessionIdInAndStatusIn(List.of(22L), List.of("BOOKED", "CONFIRMED")))
                .thenReturn(List.of(Booking.builder().sessionId(22L).status("BOOKED").build()));

        List<ReceptionistClassResponse> result = bookingService.getReceptionistSchedule(weekStart);

        assertEquals(1, result.size());
        assertEquals("Pickleball", result.get(0).sportName());
        assertEquals("Sân Pro 01", result.get(0).facilityName());
        assertEquals("Huấn luyện viên", result.get(0).coachName());
        assertEquals(1, result.get(0).bookedSlots());
    }

    @Test
    void courtCheckoutCreatesPaidHourlyReservation() {
        SportsCourt court = court();
        User member = User.builder().userId(11L).role("MEMBER").status("ACTIVE").build();
        LocalDateTime start = LocalDate.now().plusDays(1).atTime(10, 0);
        LocalDateTime end = start.plusHours(1);
        lenient().when(userRepository.findById(11L)).thenReturn(Optional.of(member));
        lenient().when(userRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(member));
        when(sportsCourtRepository.findByIdForUpdate(33L)).thenReturn(Optional.of(court));
        when(courtBookingRepository.existsConfirmedOverlap(33L, start, end)).thenReturn(false);
        when(publicSportRepository.findById(4L)).thenReturn(Optional.of(sport(4L, "Pickleball")));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction payment = invocation.getArgument(0);
            payment.setPaymentId(77L);
            return payment;
        });
        when(courtBookingRepository.save(any())).thenAnswer(invocation -> {
            var booking = invocation.getArgument(0, com.sporthub.backend.entity.CourtBooking.class);
            booking.setCourtBookingId(99L);
            return booking;
        });

        BookingConfirmationResponse response = bookingService.checkout(
                11L,
                new CheckoutRequest("COURT", 33L, start, end, PaymentConstants.METHOD_VNPAY));

        assertEquals(99L, response.bookingId());
        assertEquals(new BigDecimal("180000"), response.amountPaid());
        assertEquals("PENDING", response.paymentStatus());
    }

    @Test
    void courtCheckoutSupportsMultiHourConsecutiveReservation() {
        SportsCourt court = court();
        User member = User.builder().userId(11L).role("MEMBER").status("ACTIVE").build();
        LocalDateTime start = LocalDate.now().plusDays(1).atTime(10, 0);
        LocalDateTime end = start.plusHours(3);
        lenient().when(userRepository.findById(11L)).thenReturn(Optional.of(member));
        lenient().when(userRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(member));
        when(sportsCourtRepository.findByIdForUpdate(33L)).thenReturn(Optional.of(court));
        when(courtBookingRepository.existsConfirmedOverlap(33L, start, end)).thenReturn(false);
        when(publicSportRepository.findById(4L)).thenReturn(Optional.of(sport(4L, "Pickleball")));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction payment = invocation.getArgument(0);
            payment.setPaymentId(77L);
            return payment;
        });
        when(courtBookingRepository.save(any())).thenAnswer(invocation -> {
            var booking = invocation.getArgument(0, com.sporthub.backend.entity.CourtBooking.class);
            booking.setCourtBookingId(100L);
            return booking;
        });

        BookingConfirmationResponse response = bookingService.checkout(
                11L,
                new CheckoutRequest("COURT", 33L, start, end, PaymentConstants.METHOD_VNPAY));

        assertEquals(100L, response.bookingId());
        assertEquals(new BigDecimal("540000"), response.amountPaid());
        assertEquals("PENDING", response.paymentStatus());
    }

    @Test
    void quoteRejectsCourtSlotThatIsNotOneHour() {
        SportsCourt court = court();
        lenient().when(sportsCourtRepository.findById(33L)).thenReturn(Optional.of(court));
        lenient().when(sportsCourtRepository.findByIdForUpdate(33L)).thenReturn(Optional.of(court));
        LocalDateTime start = LocalDate.now().plusDays(1).atTime(10, 0);

        assertThrows(ResponseStatusException.class, () -> bookingService.getQuote(
                "COURT", 33L, start, start.plusMinutes(30)));
    }

    @Test
    void memberCanCancelTheirCourtBookingMoreThanTwoHoursBeforeStart() {
        CourtBooking booking = courtBooking(11L, LocalDateTime.now().plusDays(1));
        when(courtBookingRepository.findByIdForUpdate(99L)).thenReturn(Optional.of(booking));
        when(courtBookingRepository.save(booking)).thenReturn(booking);

        CancelBookingResponse cancelled = bookingService.cancelCourtBooking(99L, 11L);

        assertEquals("CANCELLED", cancelled.getStatus());
        verify(courtBookingRepository).save(booking);
    }

    @Test
    void memberCannotCancelAnotherMembersCourtBooking() {
        CourtBooking booking = courtBooking(12L, LocalDateTime.now().plusDays(1));
        when(courtBookingRepository.findByIdForUpdate(99L)).thenReturn(Optional.of(booking));

        assertThrows(ResponseStatusException.class, () -> bookingService.cancelCourtBooking(99L, 11L));
        verify(courtBookingRepository, never()).save(any(CourtBooking.class));
    }

    @Test
    void memberCanCancelLateCourtBookingWithoutRefund() {
        CourtBooking booking = courtBooking(11L, LocalDateTime.now().plusMinutes(90));
        when(courtBookingRepository.findByIdForUpdate(99L)).thenReturn(Optional.of(booking));
        CancelBookingResponse result = bookingService.cancelCourtBooking(99L, 11L);
        assertEquals("CANCELLED", result.getStatus());
        assertEquals(BigDecimal.ZERO, result.getRefundAmount());
        verify(courtBookingRepository).save(booking);
    }

    @Test
    void memberCanCancelClassBookingMoreThanTwoHoursBeforeStart() {
        Booking booking = Booking.builder()
                .bookingId(101L)
                .memberId(11L)
                .sessionId(22L)
                .feeAmount(new BigDecimal("150000"))
                .status("CONFIRMED")
                .build();
        ClassSession session = session(5);
        lenient().when(bookingRepository.findById(101L)).thenReturn(Optional.of(booking));
        lenient().when(bookingRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(booking));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(bookingRepository.save(booking)).thenReturn(booking);
        when(classSessionRepository.save(session)).thenReturn(session);

        CancelBookingResponse cancelled = bookingService.cancelClassBooking(101L, 11L);

        assertEquals("CANCELLED", cancelled.getStatus());
        assertEquals("CLASS", cancelled.getBookingType());
        verify(bookingRepository).save(booking);
    }

    @Test
    void memberCanCancelClassBookingWithQuotaAndRestoresQuota() {
        Booking booking = Booking.builder()
                .bookingId(102L)
                .memberId(11L)
                .sessionId(22L)
                .feeAmount(BigDecimal.ZERO)
                .usesMembershipQuota(true)
                .membershipId(55L)
                .status("CONFIRMED")
                .build();
        ClassSession session = session(5);
        lenient().when(bookingRepository.findById(102L)).thenReturn(Optional.of(booking));
        lenient().when(bookingRepository.findByIdForUpdate(102L)).thenReturn(Optional.of(booking));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(bookingRepository.save(booking)).thenReturn(booking);
        when(classSessionRepository.save(session)).thenReturn(session);

        CancelBookingResponse cancelled = bookingService.cancelClassBooking(102L, 11L);

        assertEquals("CANCELLED", cancelled.getStatus());
        verify(membershipService).refundQuotaForExcusedAbsence(55L, 1, session.getStartTime());
        verify(bookingRepository).save(booking);
    }

    @Test
    void memberCannotCancelClassBookingAfterSessionStarted() {
        Booking booking = Booking.builder()
                .bookingId(103L)
                .memberId(11L)
                .sessionId(22L)
                .status("CONFIRMED")
                .build();
        ClassSession pastSession = session(5);
        pastSession.setStartTime(LocalDateTime.now().minusMinutes(30));
        lenient().when(bookingRepository.findById(103L)).thenReturn(Optional.of(booking));
        lenient().when(bookingRepository.findByIdForUpdate(103L)).thenReturn(Optional.of(booking));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(pastSession));

        assertThrows(ResponseStatusException.class, () -> bookingService.cancelClassBooking(103L, 11L));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void memberCanCancelCourtBookingWithQuotaAndRestoresQuota() {
        CourtBooking booking = courtBooking(11L, LocalDateTime.now().plusDays(1));
        booking.setUsesMembershipQuota(true);
        booking.setMembershipId(77L);
        booking.setQuotaHoursUsed(BigDecimal.valueOf(1.0));
        booking.setAmountPaid(BigDecimal.ZERO);
        when(courtBookingRepository.findByIdForUpdate(99L)).thenReturn(Optional.of(booking));
        when(courtBookingRepository.save(booking)).thenReturn(booking);

        CancelBookingResponse cancelled = bookingService.cancelCourtBooking(99L, 11L);

        assertEquals("CANCELLED", cancelled.getStatus());
        verify(membershipService).releaseCourtQuota(77L, 1.0);
        verify(courtBookingRepository).save(booking);
    }

    private CourtBooking courtBooking(Long memberId, LocalDateTime startTime) {
        CourtBooking booking = new CourtBooking();
        booking.setCourtBookingId(99L);
        booking.setMemberId(memberId);
        booking.setStartTime(startTime);
        booking.setEndTime(startTime.plusHours(1));
        booking.setStatus("CONFIRMED");
        return booking;
    }

    private ClassSession session(int maxSlots) {
        return ClassSession.builder()
                .sessionId(22L)
                .className("Class session")
                .sportId(4L)
                .coachId(8L)
                .facilityId(5L)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .maxSlots(maxSlots)
                .bookedSlots(0)
                .priceAmount(new BigDecimal("275000"))
                .status("SCHEDULED")
                .build();
    }

    private PublicSport sport(Long id, String name) {
        PublicSport sport = new PublicSport();
        sport.setSportId(id);
        sport.setName(name);
        sport.setActive(true);
        return sport;
    }

    private PublicFacility facility(Long id, String name) {
        PublicFacility facility = new PublicFacility();
        facility.setFacilityId(id);
        facility.setName(name);
        facility.setActive(true);
        return facility;
    }

    @Test
    void courtSlotQuoteRejectsWhenCourtUnderMaintenance() {
        SportsCourt court = court();
        lenient().when(sportsCourtRepository.findById(33L)).thenReturn(Optional.of(court));
        lenient().when(sportsCourtRepository.findByIdForUpdate(33L)).thenReturn(Optional.of(court));
        when(publicSportRepository.findById(4L)).thenReturn(Optional.of(sport(4L, "Pickleball")));
        LocalDateTime start = LocalDate.now().plusDays(1).atTime(8, 0);
        LocalDateTime end = start.plusHours(1);
        when(courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(33L, end, start))
                .thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                bookingService.getQuote("COURT", 33L, start, end, 11L));
        assertEquals(409, ex.getStatusCode().value());
        org.junit.jupiter.api.Assertions.assertTrue(ex.getReason().contains("bảo trì"));
    }

    @Test
    void courtCheckoutRejectsWhenCourtUnderMaintenance() {
        SportsCourt court = court();
        User member = User.builder().userId(11L).role("MEMBER").status("ACTIVE").build();
        lenient().when(userRepository.findById(11L)).thenReturn(Optional.of(member));
        lenient().when(userRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(member));
        when(sportsCourtRepository.findByIdForUpdate(33L)).thenReturn(Optional.of(court));
        LocalDateTime start = LocalDate.now().plusDays(1).atTime(9, 0);
        LocalDateTime end = start.plusHours(1);
        when(courtMaintenanceRepository.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(33L, end, start))
                .thenReturn(true);

        CheckoutRequest request = new CheckoutRequest("COURT", 33L, start, end, PaymentConstants.METHOD_VNPAY);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                bookingService.checkout(11L, request));
        assertEquals(409, ex.getStatusCode().value());
        org.junit.jupiter.api.Assertions.assertTrue(ex.getReason().contains("bảo trì"));
    }

    @Test
    void courtSlotsExcludeMaintenanceHours() {
        SportsCourt court = court();
        when(sportsCourtRepository.findBySportIdAndActiveTrueOrderByCourtIdAsc(4L))
                .thenReturn(List.of(court));
        when(publicSportRepository.findById(4L)).thenReturn(Optional.of(sport(4L, "Pickleball")));
        LocalDateTime startMaint = LocalDate.now().atTime(8, 0);
        LocalDateTime endMaint = LocalDate.now().atTime(12, 0);
        CourtMaintenance maint = CourtMaintenance.builder()
                .maintenanceId(1L)
                .courtId(33L)
                .startTime(startMaint)
                .endTime(endMaint)
                .reason("Sửa sàn")
                .build();
        when(courtMaintenanceRepository.findByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(eq(33L), any(), any()))
                .thenReturn(List.of(maint));

        List<com.sporthub.backend.dto.CourtSlotResponse> slots = bookingService.getAvailableCourtSlots(4L);
        boolean hasSlotInMaint = slots.stream().anyMatch(s ->
                s.courtId().equals(33L) &&
                s.startTime().isBefore(endMaint) &&
                s.endTime().isAfter(startMaint));
        org.junit.jupiter.api.Assertions.assertFalse(hasSlotInMaint, "Slots must exclude maintenance period");
    }

    @Test
    void coachCanViewOngoingAndAssignedClassesEvenIfStarted() {
        LocalDateTime startedAnHourAgo = LocalDateTime.now().minusHours(1);
        ClassSession ongoingSession = ClassSession.builder()
                .sessionId(101L)
                .className("Ongoing Class")
                .coachId(7L)
                .sportId(1L)
                .facilityId(1L)
                .startTime(startedAnHourAgo)
                .endTime(startedAnHourAgo.plusHours(2))
                .status("SCHEDULED")
                .maxSlots(10)
                .priceAmount(BigDecimal.valueOf(100000))
                .build();
        when(classSessionRepository.findByCoachIdOrderByStartTimeAsc(7L)).thenReturn(List.of(ongoingSession));
        when(userRepository.findAllById(any())).thenReturn(List.of(User.builder().userId(7L).fullName("Coach Phat").build()));

        var result = bookingService.getUpcomingClasses(7L, "COACH");
        assertEquals(1, result.size());
        assertEquals(101L, result.get(0).sessionId());
        assertEquals("Ongoing Class", result.get(0).className());
    }

    @Test
    void classCheckoutWithQuotaCreatesTransactionAndSendsNotification() {
        ClassSession session = session(4);
        User member = User.builder().userId(11L).role("MEMBER").status("ACTIVE").build();
        User coach = User.builder().userId(8L).fullName("Coach Nam").build();
        UserMembership membership = new UserMembership();
        membership.setMembershipId(55L);
        membership.setUserId(11L);
        membership.setRemainingQuotaSessions(3);

        when(userRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(member));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(membershipService.getActiveMembershipWithQuota(eq(11L), eq(1), eq("CLASS"), eq(4L), any(), any())).thenReturn(membership);
        when(publicSportRepository.findById(4L)).thenReturn(Optional.of(sport(4L, "Pickleball")));
        when(publicFacilityRepository.findById(5L)).thenReturn(Optional.of(facility(5L, "Court hall")));
        when(userRepository.findById(8L)).thenReturn(Optional.of(coach));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> {
            PaymentTransaction tx = inv.getArgument(0);
            tx.setPaymentId(100L);
            return tx;
        });
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            b.setBookingId(200L);
            return b;
        });
        when(bookingRepository.countBySessionIdAndStatusIn(eq(22L), anyList())).thenReturn(0L, 1L);

        BookingConfirmationResponse response = bookingService.checkout(
                11L,
                new CheckoutRequest("CLASS", 22L, null, null, PaymentConstants.METHOD_MEMBERSHIP_QUOTA, true, null));

        assertEquals(100L, response.paymentId());
        assertEquals(PaymentConstants.PAYMENT_STATUS_PAID, response.paymentStatus());
        assertNotNull(response.referenceCode());
        assertTrue(Boolean.TRUE.equals(response.usedQuota()));
        verify(engagementService).notifyUser(
                eq(11L),
                eq("Đăng ký lớp bằng quota thành công"),
                org.mockito.ArgumentMatchers.contains("Class session"),
                eq("BOOKING"));
    }

    @Test
    void courtCheckoutWithQuotaCreatesTransactionConfirmationAndSendsNotification() {
        SportsCourt court = court();
        User member = User.builder().userId(11L).role("MEMBER").status("ACTIVE").build();
        UserMembership membership = new UserMembership();
        membership.setMembershipId(77L);
        membership.setUserId(11L);
        membership.setRemainingQuotaCourts(8);
        LocalDateTime start = LocalDate.now().plusDays(1).atTime(14, 0);
        LocalDateTime end = start.plusHours(2);

        when(userRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(member));
        when(sportsCourtRepository.findByIdForUpdate(33L)).thenReturn(Optional.of(court));
        when(membershipService.getActiveMembershipWithCourtQuota(eq(11L), eq(2.0), any(), any())).thenReturn(membership);
        when(userMembershipRepository.findById(77L)).thenReturn(Optional.of(membership));
        when(publicSportRepository.findById(4L)).thenReturn(Optional.of(sport(4L, "Tennis")));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> {
            PaymentTransaction tx = inv.getArgument(0);
            tx.setPaymentId(101L);
            return tx;
        });
        when(courtBookingRepository.save(any(CourtBooking.class))).thenAnswer(inv -> {
            CourtBooking cb = inv.getArgument(0);
            cb.setCourtBookingId(301L);
            return cb;
        });

        BookingConfirmationResponse response = bookingService.checkout(
                11L,
                new CheckoutRequest("COURT", 33L, start, end, PaymentConstants.METHOD_MEMBERSHIP_QUOTA, true, null));

        ArgumentCaptor<PaymentTransaction> txCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(txCaptor.capture());
        PaymentTransaction savedTx = txCaptor.getValue();
        assertEquals("COURT", savedTx.getBookingType());
        assertEquals("COURT", savedTx.getItemType());
        assertEquals("Court 1 - Tennis (2.0 giờ)", savedTx.getItemDescription());
        assertEquals(0, savedTx.getAmount().compareTo(BigDecimal.ZERO));
        assertEquals(PaymentConstants.METHOD_MEMBERSHIP_QUOTA, savedTx.getPaymentMethod());
        assertEquals(PaymentConstants.PAYMENT_STATUS_PAID, savedTx.getPaymentStatus());

        ArgumentCaptor<CourtBooking> bookingCaptor = ArgumentCaptor.forClass(CourtBooking.class);
        verify(courtBookingRepository).save(bookingCaptor.capture());
        assertEquals(101L, bookingCaptor.getValue().getPaymentId());

        assertEquals(101L, response.paymentId());
        assertEquals(PaymentConstants.PAYMENT_STATUS_PAID, response.paymentStatus());
        assertEquals(savedTx.getReferenceCode(), response.referenceCode());
        assertTrue(Boolean.TRUE.equals(response.usedQuota()));
        verify(engagementService).notifyUser(
                eq(11L),
                eq("Đặt sân bằng quota thành công"),
                org.mockito.ArgumentMatchers.contains("Court 1"),
                eq("BOOKING"));
    }

    @Test
    void timelyClassCancelWithQuotaCreatesRefundTransactionAndNotifies() {
        PaymentTransaction originalTx = new PaymentTransaction();
        originalTx.setPaymentId(100L);
        originalTx.setBookingType("CLASS");
        originalTx.setReferenceCode("CLS-ABC123");
        originalTx.setAmount(BigDecimal.ZERO);
        originalTx.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_PAID);

        Booking booking = Booking.builder()
                .bookingId(102L)
                .memberId(11L)
                .sessionId(22L)
                .paymentId(100L)
                .feeAmount(BigDecimal.ZERO)
                .usesMembershipQuota(true)
                .membershipId(55L)
                .status("CONFIRMED")
                .build();
        ClassSession session = session(5);

        when(bookingRepository.findByIdForUpdate(102L)).thenReturn(Optional.of(booking));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(paymentTransactionRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(originalTx));
        when(paymentTransactionRepository.findById(100L)).thenReturn(Optional.of(originalTx));
        when(bookingRepository.save(booking)).thenReturn(booking);
        when(classSessionRepository.save(session)).thenReturn(session);

        CancelBookingResponse cancelled = bookingService.cancelClassBooking(102L, 11L);

        assertEquals("CANCELLED", cancelled.getStatus());
        assertTrue(Boolean.TRUE.equals(cancelled.getRefunded()));
        assertEquals(PaymentConstants.PAYMENT_STATUS_REFUNDED, cancelled.getRefundStatus());
        assertTrue(cancelled.getMessage().contains("hoàn 1 buổi quota"));

        ArgumentCaptor<PaymentTransaction> refundCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(refundCaptor.capture());
        PaymentTransaction refundTx = refundCaptor.getValue();
        assertEquals("CLASS_REFUND", refundTx.getBookingType());
        assertEquals("CLASS", refundTx.getItemType());
        assertEquals("Hoàn quota: Class session", refundTx.getItemDescription());
        assertEquals(0, refundTx.getAmount().compareTo(BigDecimal.ZERO));
        assertEquals(PaymentConstants.METHOD_MEMBERSHIP_QUOTA, refundTx.getPaymentMethod());
        assertEquals(PaymentConstants.PAYMENT_STATUS_REFUNDED, refundTx.getPaymentStatus());
        assertEquals("REFUND_CLS-ABC123", refundTx.getReferenceCode());

        verify(engagementService).notifyUser(
                eq(11L),
                eq("Hủy lớp & hoàn quota thành công"),
                org.mockito.ArgumentMatchers.contains("hoàn 1 buổi quota"),
                eq("REFUND"));
    }

    @Test
    void timelyCourtCancelWithQuotaCreatesRefundTransactionAndNotifies() {
        PaymentTransaction originalTx = new PaymentTransaction();
        originalTx.setPaymentId(101L);
        originalTx.setBookingType("COURT");
        originalTx.setReferenceCode("CRT-XYZ999");
        originalTx.setAmount(BigDecimal.ZERO);
        originalTx.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_PAID);

        CourtBooking booking = courtBooking(11L, LocalDateTime.now().plusDays(1));
        booking.setCourtId(33L);
        booking.setPaymentId(101L);
        booking.setUsesMembershipQuota(true);
        booking.setMembershipId(77L);
        booking.setQuotaHoursUsed(BigDecimal.valueOf(2.0));
        booking.setAmountPaid(BigDecimal.ZERO);

        when(sportsCourtRepository.findById(33L)).thenReturn(Optional.of(court()));
        when(courtBookingRepository.findByIdForUpdate(99L)).thenReturn(Optional.of(booking));
        when(paymentTransactionRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(originalTx));
        when(paymentTransactionRepository.findById(101L)).thenReturn(Optional.of(originalTx));
        when(courtBookingRepository.save(booking)).thenReturn(booking);

        CancelBookingResponse cancelled = bookingService.cancelCourtBooking(99L, 11L);

        assertEquals("CANCELLED", cancelled.getStatus());
        assertTrue(Boolean.TRUE.equals(cancelled.getRefunded()));
        assertEquals(PaymentConstants.PAYMENT_STATUS_REFUNDED, cancelled.getRefundStatus());
        assertTrue(cancelled.getMessage().contains("hoàn 2.0 giờ quota"));

        ArgumentCaptor<PaymentTransaction> refundCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(refundCaptor.capture());
        PaymentTransaction refundTx = refundCaptor.getValue();
        assertEquals("COURT_REFUND", refundTx.getBookingType());
        assertEquals("COURT", refundTx.getItemType());
        assertEquals("Hoàn quota: Court 1 (2.0 giờ)", refundTx.getItemDescription());
        assertEquals(0, refundTx.getAmount().compareTo(BigDecimal.ZERO));
        assertEquals(PaymentConstants.METHOD_MEMBERSHIP_QUOTA, refundTx.getPaymentMethod());
        assertEquals(PaymentConstants.PAYMENT_STATUS_REFUNDED, refundTx.getPaymentStatus());
        assertEquals("REFUND_CRT-XYZ999", refundTx.getReferenceCode());

        verify(engagementService).notifyUser(
                eq(11L),
                eq("Hủy sân & hoàn quota thành công"),
                org.mockito.ArgumentMatchers.contains("hoàn 2.0 giờ quota"),
                eq("REFUND"));
    }

    @Test
    void lateCourtCancelWithQuotaSkipsRefundTransactionAndNotifiesNoRefund() {
        CourtBooking booking = courtBooking(11L, LocalDateTime.now().plusMinutes(60));
        booking.setCourtId(33L);
        booking.setUsesMembershipQuota(true);
        booking.setMembershipId(77L);
        booking.setQuotaHoursUsed(BigDecimal.valueOf(1.0));
        booking.setAmountPaid(BigDecimal.ZERO);

        when(sportsCourtRepository.findById(33L)).thenReturn(Optional.of(court()));
        when(courtBookingRepository.findByIdForUpdate(99L)).thenReturn(Optional.of(booking));
        when(courtBookingRepository.save(booking)).thenReturn(booking);

        CancelBookingResponse cancelled = bookingService.cancelCourtBooking(99L, 11L);

        assertEquals("CANCELLED", cancelled.getStatus());
        assertFalse(Boolean.TRUE.equals(cancelled.getRefunded()));
        assertEquals("NONE", cancelled.getRefundStatus());
        verify(membershipService).consumeCourtQuota(77L, 1.0);
        verify(paymentTransactionRepository, never()).save(any(PaymentTransaction.class));
        verify(engagementService).notifyUser(
                eq(11L),
                eq("Đã hủy đặt sân"),
                org.mockito.ArgumentMatchers.contains("không hoàn"),
                eq("BOOKING"));
    }

    @Test
    void receptionistCanEnrollAndCancelClassForMember() {
        ClassSession session = session(5);
        User member = User.builder().userId(11L).role("MEMBER").status("ACTIVE").build();
        PublicSport sport = sport(4L, "Pickleball");
        PublicFacility facility = facility(5L, "Court hall");
        User coach = User.builder().userId(8L).fullName("Coach").build();
        lenient().when(userRepository.findById(11L)).thenReturn(Optional.of(member));
        lenient().when(userRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(member));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(bookingRepository.existsByMemberIdAndSessionIdAndStatusIn(eq(11L), eq(22L), anyList())).thenReturn(false);
        when(bookingRepository.countBySessionIdAndStatusIn(eq(22L), anyList())).thenReturn(0L, 1L, 0L);
        when(publicSportRepository.findById(4L)).thenReturn(Optional.of(sport));
        when(publicFacilityRepository.findById(5L)).thenReturn(Optional.of(facility));
        lenient().when(userRepository.findById(8L)).thenReturn(Optional.of(coach));
        PaymentTransaction savedTx = new PaymentTransaction();
        savedTx.setPaymentId(77L);
        savedTx.setAmount(new BigDecimal("275000"));
        savedTx.setPaymentMethod(PaymentConstants.METHOD_CASH_COUNTER);
        savedTx.setPaymentStatus("PENDING");
        savedTx.setReferenceCode("CLS-CASH77");
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> {
            PaymentTransaction p = inv.getArgument(0);
            if (p.getPaymentId() == null) p.setPaymentId(77L);
            return p;
        });
        when(paymentTransactionRepository.findById(77L)).thenReturn(Optional.of(savedTx));
        Booking savedBooking = Booking.builder().bookingId(88L).memberId(11L).sessionId(22L).status("BOOKED").build();
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            if (b.getBookingId() == null) b.setBookingId(88L);
            return b;
        });
        when(bookingRepository.findById(88L)).thenReturn(Optional.of(savedBooking));

        BookingConfirmationResponse enrollRes = bookingService.enrollMemberInClassByReceptionist(
                22L, 11L, "CASH", false, null, 3L, "RECEPTIONIST");
        assertEquals("PAID", enrollRes.paymentStatus());
        assertEquals("CONFIRMED", savedBooking.getStatus());
        assertEquals(3L, savedTx.getProcessedBy());
        verify(engagementService).audit(eq(3L), eq("RECEPTIONIST"), eq("RECEPTION_CLASS_ENROLL"), any());

        PaymentTransaction vnpayTx = new PaymentTransaction();
        vnpayTx.setPaymentId(78L);
        vnpayTx.setBookingType("CLASS");
        vnpayTx.setPaymentMethod(PaymentConstants.METHOD_VNPAY);
        vnpayTx.setPaymentStatus("PENDING");
        vnpayTx.setReferenceCode("CLS-VNP78");
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(inv -> {
            PaymentTransaction p = inv.getArgument(0);
            if (p.getPaymentId() == null) p.setPaymentId(78L);
            return p;
        });
        when(paymentTransactionRepository.findById(78L)).thenReturn(Optional.of(vnpayTx));
        BookingConfirmationResponse vnpayEnrollRes = bookingService.enrollMemberInClassByReceptionist(
                22L, 11L, "VNPAY", false, null, 4L, "RECEPTIONIST");
        assertEquals("PENDING", vnpayEnrollRes.paymentStatus());
        assertEquals(4L, vnpayTx.getProcessedBy());

        // Staff cancellation on a quota booking refunds quota and notifies member
        Booking quotaBooking = Booking.builder()
                .bookingId(102L).memberId(11L).sessionId(22L).paymentId(100L)
                .usesMembershipQuota(true).membershipId(55L).status("CONFIRMED").build();
        PaymentTransaction quotaTx = new PaymentTransaction();
        quotaTx.setPaymentId(100L);
        quotaTx.setBookingType("CLASS");
        quotaTx.setReferenceCode("CLS-Q100");
        quotaTx.setAmount(BigDecimal.ZERO);
        quotaTx.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_PAID);
        when(bookingRepository.findByIdForUpdate(102L)).thenReturn(Optional.of(quotaBooking));
        when(paymentTransactionRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(quotaTx));
        when(paymentTransactionRepository.findById(100L)).thenReturn(Optional.of(quotaTx));

        CancelBookingResponse cancelRes = bookingService.cancelClassBookingByStaff(102L, 3L, "RECEPTIONIST");
        assertEquals("CANCELLED", cancelRes.getStatus());
        assertTrue(Boolean.TRUE.equals(cancelRes.getRefunded()));
        verify(engagementService).audit(eq(3L), eq("RECEPTIONIST"), eq("RECEPTION_CLASS_CANCEL"), any());
    }

    private SportsCourt court() {
        SportsCourt court = new SportsCourt();
        court.setCourtId(33L);
        court.setSportId(4L);
        court.setCourtName("Court 1");
        court.setDescription("Indoor");
        court.setHourlyRate(new BigDecimal("180000"));
        court.setOpensAt(LocalTime.of(6, 0));
        court.setClosesAt(LocalTime.of(22, 0));
        court.setActive(true);
        return court;
    }
}
