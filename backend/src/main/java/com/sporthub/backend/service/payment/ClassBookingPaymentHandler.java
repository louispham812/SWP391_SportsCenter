package com.sporthub.backend.service.payment;

import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.service.EngagementService;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Handle CLASS booking payment confirmation
 */
@Component
public class ClassBookingPaymentHandler implements BookingPaymentHandler {
    
    private final BookingRepository bookingRepository;
    private final EngagementService engagementService;
    
    public ClassBookingPaymentHandler(
            BookingRepository bookingRepository,
            EngagementService engagementService) {
        this.bookingRepository = bookingRepository;
        this.engagementService = engagementService;
    }
    
    @Override
    public String getSupportedBookingType() {
        return "CLASS";
    }
    
    @Override
    public Map<String, Object> handlePaymentConfirmation(PaymentTransaction payment, Double transferAmount) {
        Long paymentId = payment.getPaymentId();
        Booking classBooking = bookingRepository.findByPaymentId(paymentId);
        
        if (classBooking == null) {
            return null; // Not our booking type
        }
        
        // Rule 9: Check if booking already CANCELLED (late payment)
        if ("CANCELLED".equalsIgnoreCase(classBooking.getStatus())) {
            System.out.println("⚠ CLASS Booking #" + classBooking.getBookingId() + " already CANCELLED (late payment)");
            if (engagementService != null) {
                engagementService.notifyUser(
                    classBooking.getMemberId(), "Thanh toán đến muộn",
                    "Lớp học #" + classBooking.getBookingId() + " đã bị hủy do quá hạn. Vui lòng liên hệ quầy để được hoàn tiền.", "PAYMENT"
                );
            }
        } else {
            // Update booking status to CONFIRMED
            classBooking.setStatus("CONFIRMED");
            bookingRepository.save(classBooking);
            System.out.println("✓✓✓ CLASS Booking #" + classBooking.getBookingId() + " confirmed");
            
            // Send success notification
            if (engagementService != null) {
                engagementService.audit(
                    classBooking.getMemberId(), "MEMBER", "SEPAY_PAYMENT_CONFIRMED",
                    "bookingId=" + classBooking.getBookingId() + ", paymentId=" + paymentId +
                    ", amount=" + transferAmount
                );
                engagementService.notifyUser(
                    classBooking.getMemberId(), "Thanh toán thành công",
                    "Đã nhận thanh toán cho lớp học #" + classBooking.getBookingId(), "PAYMENT"
                );
            }
        }
        
        return Map.of(
            "success", true, 
            "paymentId", paymentId, 
            "bookingType", "CLASS", 
            "bookingId", classBooking.getBookingId()
        );
    }
}
