package com.sporthub.backend.service;

import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class UnpaidPaymentCancellationService {
    private final PaymentTransactionRepository payments;
    private final BookingRepository bookings;
    private final CourtBookingRepository courts;
    private final ClassSessionRepository sessions;
    private final UserMembershipRepository memberships;
    private final ReceptionPaymentRepository receipts;
    private final VoucherService vouchers;

    public UnpaidPaymentCancellationService(PaymentTransactionRepository payments, BookingRepository bookings,
            CourtBookingRepository courts, ClassSessionRepository sessions, UserMembershipRepository memberships,
            ReceptionPaymentRepository receipts, VoucherService vouchers) {
        this.payments = payments; this.bookings = bookings; this.courts = courts; this.sessions = sessions;
        this.memberships = memberships; this.receipts = receipts; this.vouchers = vouchers;
    }

    // Caller holds the payment write lock, shared with gateway callbacks and cashier collection.
    @Transactional
    public PaymentTransaction cancelLocked(PaymentTransaction payment) {
        if (!"VNPAY".equals(payment.getPaymentMethod()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ hủy tự động giao dịch VNPay chưa thanh toán.");
        if (!List.of("PENDING", "FAILED").contains(payment.getPaymentStatus())) return payment;
        switch (payment.getBookingType()) {
            case "CLASS", "PT" -> {
                Booking candidate = bookings.findByPaymentId(payment.getPaymentId());
                if (candidate == null) throw inconsistent();
                Booking booking = bookings.findByIdForUpdate(candidate.getBookingId()).orElseThrow();
                if (!List.of("BOOKED", "CANCELLED").contains(booking.getStatus())
                        || Boolean.TRUE.equals(booking.getUsesMembershipQuota())) throw inconsistent();
                ClassSession session = sessions.findByIdForUpdate(booking.getSessionId()).orElseThrow();
                booking.setStatus("CANCELLED"); bookings.save(booking);
                if ("PT".equals(payment.getBookingType())) session.setStatus("CANCELLED");
                session.setBookedSlots((int) bookings.countBySessionIdAndStatusIn(session.getSessionId(), List.of("BOOKED", "CONFIRMED")));
                sessions.save(session);
            }
            case "COURT" -> {
                CourtBooking candidate = courts.findByPaymentId(payment.getPaymentId());
                if (candidate == null) throw inconsistent();
                CourtBooking booking = courts.findByIdForUpdate(candidate.getCourtBookingId()).orElseThrow();
                if (!List.of("PENDING", "CANCELLED").contains(booking.getStatus())
                        || Boolean.TRUE.equals(booking.getUsesMembershipQuota())) throw inconsistent();
                booking.setStatus("CANCELLED"); courts.save(booking);
            }
            case "MEMBERSHIP_PACKAGE" -> {
                if (payment.getMembershipId() == null) throw inconsistent();
                UserMembership membership = memberships.findByIdForUpdate(payment.getMembershipId()).orElseThrow();
                if (!payment.getMemberId().equals(membership.getUserId())
                        || !List.of("PENDING_PAYMENT", "CANCELLED").contains(membership.getStatus())) throw inconsistent();
                membership.setStatus("CANCELLED"); memberships.save(membership);
                receipts.findByMemberIdOrderByCreatedAtDesc(Math.toIntExact(payment.getMemberId())).stream()
                    .filter(r -> r.getMembershipId() != null && r.getMembershipId().longValue() == membership.getMembershipId())
                    .forEach(r -> { r.setPaymentStatus("FAILED"); receipts.save(r); });
            }
            default -> throw inconsistent();
        }
        payment.setPaymentStatus("CANCELLED");
        vouchers.release(payment);
        return payments.save(payment);
    }

    private ResponseStatusException inconsistent() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "Trạng thái đơn hàng không phù hợp để hủy giao dịch chưa thanh toán.");
    }
}
