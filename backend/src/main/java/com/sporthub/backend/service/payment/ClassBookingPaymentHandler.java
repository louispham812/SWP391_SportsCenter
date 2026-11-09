package com.sporthub.backend.service.payment;
import com.sporthub.backend.dto.PaymentConfirmationResult;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.*;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class ClassBookingPaymentHandler implements BookingPaymentHandler {
    private final BookingRepository bookings;
    private final EngagementService engagement;
    @org.springframework.beans.factory.annotation.Autowired private ClassSessionRepository sessions;
    @org.springframework.beans.factory.annotation.Autowired private LatePaymentService latePayments;
    public ClassBookingPaymentHandler(BookingRepository bookings, EngagementService engagement) { this.bookings = bookings; this.engagement = engagement; }
    @Override public String getSupportedBookingType() { return "CLASS"; }
    @Override @Transactional
    public PaymentConfirmationResult handlePaymentConfirmation(PaymentTransaction payment, Double amount) {
        Booking candidate = bookings.findByPaymentId(payment.getPaymentId());
        if (candidate == null) return null;
        Booking booking = bookings.findByIdForUpdate(candidate.getBookingId()).orElseThrow();
        ClassSession session = sessions.findByIdForUpdate(booking.getSessionId()).orElseThrow();
        if (!"CONFIRMED".equals(booking.getStatus())) {
            boolean available = "BOOKED".equals(booking.getStatus()) && !"CANCELLED".equals(session.getStatus())
                && booking.getBookingTime() != null && booking.getBookingTime().plusMinutes(10).isAfter(LocalDateTime.now())
                && bookings.countBySessionIdAndStatusIn(session.getSessionId(), List.of("BOOKED", "CONFIRMED")) <= session.getMaxSlots();
            booking.setStatus(available ? "CONFIRMED" : "CANCELLED"); bookings.save(booking);
            if (!available) {
                if ("PT".equals(payment.getBookingType())) session.setStatus("CANCELLED");
                latePayments.requestRefund(payment, booking.getBookingId(), "CLASS");
            } else engagement.notifyUser(booking.getMemberId(), "Thanh toán thành công", "Buổi học đã được xác nhận.", "PAYMENT");
            session.setBookedSlots((int) bookings.countBySessionIdAndStatusIn(session.getSessionId(), List.of("BOOKED", "CONFIRMED"))); sessions.save(session);
        }
        return PaymentConfirmationResult.builder().success("CONFIRMED".equals(booking.getStatus())).paymentId(payment.getPaymentId())
            .bookingType(payment.getBookingType()).bookingId(booking.getBookingId()).status(booking.getStatus()).build();
    }
}
