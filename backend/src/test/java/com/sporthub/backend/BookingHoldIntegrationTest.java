package com.sporthub.backend;

import com.sporthub.backend.dto.CheckoutRequest;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.BookingService;
import com.sporthub.backend.service.PaymentAttemptService;
import com.sporthub.backend.service.BookingLifecycleService;
import com.sporthub.backend.service.CheckInService;
import com.sporthub.backend.service.gateway.PaymentGateway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@SpringBootTest(properties = "sporthub.scheduling.enabled=false")
@Transactional
class BookingHoldIntegrationTest {
    @Autowired BookingService bookingService;
    @Autowired UserRepository users;
    @Autowired PublicSportRepository sports;
    @Autowired SportsCourtRepository courts;
    @Autowired CourtBookingRepository courtBookings;
    @Autowired PaymentTransactionRepository payments;
    @Autowired PaymentAttemptService attempts;
    @Autowired GatewayReceiptRepository receipts;
    @Autowired UserMembershipRepository memberships;
    @Autowired MembershipPackageRepository packages;
    @Autowired CourtMaintenanceRepository maintenance;
    @Autowired BookingLifecycleService lifecycle;
    @Autowired CheckInService checkIn;
    @Autowired ClassSessionRepository sessions;
    @Autowired PublicFacilityRepository facilities;
    @Autowired BookingRepository bookings;
    @jakarta.persistence.PersistenceContext jakarta.persistence.EntityManager entityManager;

    User member() {
        return users.saveAndFlush(User.builder().fullName("Rollback logic fixture").email("remaining-" + UUID.randomUUID() + "@example.test")
            .passwordHash("unused").role("MEMBER").status("ACTIVE").build());
    }
    SportsCourt court() {
        SportsCourt court = new SportsCourt(); court.setSportId(sports.findAll().getFirst().getSportId()); court.setCourtName("Rollback " + UUID.randomUUID());
        court.setHourlyRate(BigDecimal.TEN); court.setOpensAt(LocalTime.MIN); court.setClosesAt(LocalTime.of(23, 59, 59)); court.setActive(true); return courts.saveAndFlush(court);
    }
    UserMembership expiredTerm(User user) {
        UserMembership m = new UserMembership(); m.setUserId(user.getUserId()); m.setPackageId(packages.findAll().getFirst().getPackageId());
        m.setStartDate(LocalDate.now().minusDays(30)); m.setEndDate(LocalDate.now().minusDays(1)); m.setStatus("EXPIRED");
        return memberships.saveAndFlush(m);
    }

    @Test void gatewayAttemptsAndDistinctReceiptsPersistWithoutDroppingExcessMoney() {
        User user = member(); PaymentTransaction p = new PaymentTransaction(); p.setMemberId(user.getUserId()); p.setBookingType("COURT");
        p.setAmount(BigDecimal.TEN); p.setPaymentMethod("VNPAY"); p.setPaymentStatus("PENDING"); p.setReferenceCode("test-" + UUID.randomUUID()); p.setCreatedAt(LocalDateTime.now());
        p = payments.saveAndFlush(p); p = payments.findByIdForUpdate(p.getPaymentId()).orElseThrow();
        PaymentGateway gateway = mock(PaymentGateway.class);
        when(gateway.generatePaymentAttempt(any(), any(), any(), any(), any(), any())).thenAnswer(i -> java.util.Map.of("paymentUrl", "https://gateway.test/?ref=" + i.getArgument(4), "merchantDate", "20261109115900"));
        var link = attempts.generate(p, gateway, "127.0.0.1");
        String firstRef = (String) link.get("gatewayReference"); String suffix = UUID.randomUUID().toString();
        String firstTxn = "first-" + suffix; String secondTxn = "second-" + suffix;
        var first = java.util.Map.of("vnp_TxnRef", firstRef, "vnp_TransactionNo", firstTxn, "vnp_PayDate", "20261109120000");
        assertTrue(attempts.recordSuccess(p, first, BigDecimal.TEN).applyToOrder());
        p.setPaymentStatus("PAID"); p.setReferenceCode(firstTxn); p.setGatewayReference(firstRef); payments.saveAndFlush(p);
        var second = java.util.Map.of("vnp_TxnRef", p.getPaymentId() + "_legacy_" + suffix, "vnp_TransactionNo", secondTxn, "vnp_PayDate", "20261109120100");
        assertFalse(attempts.recordSuccess(p, second, BigDecimal.TEN).applyToOrder());
        assertTrue(attempts.recordSuccess(p, second, BigDecimal.TEN).duplicate());
        entityManager.flush();
        assertEquals("APPLIED", receipts.findByGatewayTransactionNo(firstTxn).orElseThrow().getStatus());
        assertEquals("EXCESS", receipts.findByGatewayTransactionNo(secondTxn).orElseThrow().getStatus());
        assertEquals(firstTxn, p.getReferenceCode());
    }

    @Test void maintenanceExpirySettlesBookingAndHoldAtomicallyWithoutNoShowPenalty() {
        User user = member(); SportsCourt court = court(); UserMembership m = expiredTerm(user);
        m.setInitialQuotaCourts(10); m.setRemainingQuotaCourts(9); m.setHeldQuotaCourts(1); memberships.saveAndFlush(m);
        CourtBooking b = new CourtBooking(); b.setMemberId(user.getUserId()); b.setCourtId(court.getCourtId()); b.setMembershipId(m.getMembershipId());
        b.setStatus("CONFIRMED"); b.setUsesMembershipQuota(true); b.setQuotaState("HELD"); b.setQuotaHoursUsed(BigDecimal.ONE);
        b.setStartTime(LocalDateTime.now().minusDays(2)); b.setEndTime(b.getStartTime().plusHours(1)); b.setCreatedAt(LocalDateTime.now()); b = courtBookings.saveAndFlush(b);
        maintenance.saveAndFlush(CourtMaintenance.builder().courtId(court.getCourtId()).startTime(b.getStartTime()).endTime(b.getEndTime()).reason("Rollback test").createdAt(LocalDateTime.now()).build());
        lifecycle.settleExpiredMembership(m.getMembershipId()); lifecycle.settleExpiredMembership(m.getMembershipId()); entityManager.flush(); entityManager.clear();
        CourtBooking stored = courtBookings.findById(b.getCourtBookingId()).orElseThrow(); UserMembership balance = memberships.findById(m.getMembershipId()).orElseThrow();
        assertEquals("CANCELLED", stored.getStatus()); assertEquals("FORFEITED", stored.getQuotaState());
        assertEquals(0, balance.getHeldQuotaCourts()); assertEquals(0, balance.getUsedQuotaCourts()); assertEquals(10, balance.getRemainingQuotaCourts());
    }

    @Test void expiredAttendanceRoundTripPersistsItsUsedAccountingState() {
        User user = member(); UserMembership m = expiredTerm(user); m.setInitialQuotaSessions(1); m.setUsedQuotaSessions(1); memberships.saveAndFlush(m);
        Long coach = users.findByRole("COACH").getFirst().getUserId(); Long manager = users.findByRole("MANAGER").getFirst().getUserId();
        ClassSession session = sessions.saveAndFlush(ClassSession.builder().className("Rollback attendance").coachId(coach).sportId(sports.findAll().getFirst().getSportId())
            .facilityId(facilities.findAll().getFirst().getFacilityId()).startTime(LocalDateTime.now().minusDays(2)).endTime(LocalDateTime.now().minusDays(2).plusHours(1)).maxSlots(1).priceAmount(BigDecimal.ZERO).build());
        Booking b = bookings.saveAndFlush(Booking.builder().memberId(user.getUserId()).sessionId(session.getSessionId()).status("CONFIRMED").feeAmount(BigDecimal.ZERO)
            .usesMembershipQuota(true).membershipId(m.getMembershipId()).attendanceStatus(com.sporthub.backend.enums.AttendanceStatus.PRESENT).quotaState("USED").build());
        bookingService.updateAttendance(b.getBookingId(), manager, "MANAGER", "EXCUSED_ABSENCE", "Correction"); entityManager.flush(); entityManager.clear();
        bookingService.updateAttendance(b.getBookingId(), manager, "MANAGER", "PRESENT", "Correction reversed"); entityManager.flush(); entityManager.clear();
        assertEquals("USED", bookings.findById(b.getBookingId()).orElseThrow().getQuotaState());
        assertEquals(1, memberships.findById(m.getMembershipId()).orElseThrow().getUsedQuotaSessions());
    }

    @Test void checkInRechecksMaintenanceWithoutConsumingQuota() {
        User user = member(); SportsCourt court = court(); UserMembership m = expiredTerm(user); m.setStatus("ACTIVE"); m.setEndDate(LocalDate.now().plusDays(1));
        m.setInitialQuotaCourts(10); m.setRemainingQuotaCourts(9); m.setHeldQuotaCourts(1); memberships.saveAndFlush(m);
        CourtBooking b = new CourtBooking(); b.setMemberId(user.getUserId()); b.setCourtId(court.getCourtId()); b.setMembershipId(m.getMembershipId());
        b.setUsesMembershipQuota(true); b.setQuotaState("HELD"); b.setQuotaHoursUsed(BigDecimal.ONE); b.setStatus("CONFIRMED");
        b.setStartTime(LocalDateTime.now().withSecond(0).withNano(0)); b.setEndTime(b.getStartTime().plusMinutes(30)); b.setCreatedAt(LocalDateTime.now()); b = courtBookings.saveAndFlush(b);
        maintenance.saveAndFlush(CourtMaintenance.builder().courtId(court.getCourtId()).startTime(b.getStartTime()).endTime(b.getEndTime()).reason("Rollback test").createdAt(LocalDateTime.now()).build());
        Long id = b.getCourtBookingId(); ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> checkIn.checkInBooking(user.getUserId(), id));
        assertEquals(409, error.getStatusCode().value()); assertTrue(error.getReason().contains("bảo trì"));
        assertEquals("CONFIRMED", b.getStatus()); assertEquals(1, m.getHeldQuotaCourts());
    }

    @Test void aPendingCourtPaymentPreventsAnotherMemberFromReservingTheSameSlot() {
        Long sport = sports.findAll().getFirst().getSportId();
        String unique = UUID.randomUUID().toString();
        User first = users.save(User.builder().fullName("Hold audit first").email("hold-first-" + unique + "@example.test").passwordHash("unused").role("MEMBER").status("ACTIVE").build());
        User second = users.save(User.builder().fullName("Hold audit second").email("hold-second-" + unique + "@example.test").passwordHash("unused").role("MEMBER").status("ACTIVE").build());
        SportsCourt court = new SportsCourt(); court.setSportId(sport); court.setCourtName("Rollback audit " + unique);
        court.setHourlyRate(BigDecimal.valueOf(100000)); court.setOpensAt(LocalTime.of(6, 0)); court.setClosesAt(LocalTime.of(22, 0)); court.setActive(true);
        court = courts.saveAndFlush(court);
        LocalDateTime start = LocalDate.now().plusDays(3).atTime(10, 0);
        CheckoutRequest request = new CheckoutRequest("COURT", court.getCourtId(), start, start.plusHours(1), "VNPAY");
        var confirmation = bookingService.checkout(first.getUserId(), request);
        assertEquals("PENDING", confirmation.paymentStatus());
        assertEquals("PENDING", courtBookings.findById(confirmation.bookingId()).orElseThrow().getStatus());
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> bookingService.checkout(second.getUserId(), request));
        assertEquals(409, error.getStatusCode().value());
    }
}
