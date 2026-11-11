package com.sporthub.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;

@Service
public class PaymentTimeoutScheduler {
    private final BookingRepository bookings;
    private final CourtBookingRepository courts;
    private final PaymentTransactionRepository payments;
    private final EngagementService engagement;
    @org.springframework.beans.factory.annotation.Autowired private ClassSessionRepository sessions;
    @org.springframework.beans.factory.annotation.Autowired private UserMembershipRepository memberships;
    @org.springframework.beans.factory.annotation.Autowired private VoucherService vouchers;
    public PaymentTimeoutScheduler(BookingRepository bookings, CourtBookingRepository courts, PaymentTransactionRepository payments, EngagementService engagement) {
        this.bookings = bookings; this.courts = courts; this.payments = payments; this.engagement = engagement;
    }
    @Scheduled(fixedDelay = 60000, initialDelay = 60000)
    @Transactional
    public void cancelUnpaidBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(10);
        for (Booking candidate : bookings.findByStatusIgnoreCaseAndBookingTimeBefore("BOOKED", cutoff)) {
            PaymentTransaction payment = candidate.getPaymentId() == null ? null : payments.findByIdForUpdate(candidate.getPaymentId()).orElse(null);
            Booking booking = bookings.findByIdForUpdate(candidate.getBookingId()).orElseThrow();
            if (!"BOOKED".equals(booking.getStatus()) || payment == null || !List.of("PENDING", "FAILED").contains(payment.getPaymentStatus())) continue;
            booking.setStatus("CANCELLED"); bookings.save(booking); fail(payment);
            if (sessions != null) {
                ClassSession session = sessions.findByIdForUpdate(booking.getSessionId()).orElseThrow();
                if ("PT".equals(payment.getBookingType())) session.setStatus("CANCELLED");
                session.setBookedSlots((int) bookings.countBySessionIdAndStatusIn(session.getSessionId(), List.of("BOOKED", "CONFIRMED"))); sessions.save(session);
            }
        }
        for (CourtBooking candidate : courts.findByStatusIgnoreCaseAndCreatedAtBefore("PENDING", cutoff)) {
            PaymentTransaction payment = candidate.getPaymentId() == null ? null : payments.findByIdForUpdate(candidate.getPaymentId()).orElse(null);
            CourtBooking booking = courts.findByIdForUpdate(candidate.getCourtBookingId()).orElseThrow();
            if (!"PENDING".equals(booking.getStatus()) || payment == null || !List.of("PENDING", "FAILED").contains(payment.getPaymentStatus())) continue;
            booking.setStatus("CANCELLED"); courts.save(booking); fail(payment);
        }
        for (PaymentTransaction candidate : java.util.stream.Stream.concat(
                payments.findByBookingTypeAndPaymentStatusIgnoreCaseAndCreatedAtBefore("MEMBERSHIP_PACKAGE", "PENDING", cutoff).stream(),
                payments.findByBookingTypeAndPaymentStatusIgnoreCaseAndCreatedAtBefore("MEMBERSHIP_PACKAGE", "FAILED", cutoff).stream()).toList()) {
            PaymentTransaction payment = payments.findByIdForUpdate(candidate.getPaymentId()).orElseThrow();
            if (!List.of("PENDING", "FAILED").contains(payment.getPaymentStatus())) continue;
            fail(payment);
            if (memberships != null && payment.getMembershipId() != null) memberships.findByIdForUpdate(payment.getMembershipId()).ifPresent(m -> {
                if ("PENDING_PAYMENT".equals(m.getStatus())) { m.setStatus("CANCELLED"); memberships.save(m); }
            });
        }
    }
    private void fail(PaymentTransaction payment) {
        payment.setPaymentStatus("FAILED"); payments.save(payment);
        if (vouchers != null) vouchers.release(payment);
        if (engagement != null) engagement.notifyUser(payment.getMemberId(), "Giữ chỗ đã hết hạn", "Giao dịch #" + payment.getPaymentId() + " đã quá 10 phút thanh toán.", "PAYMENT");
    }
}
