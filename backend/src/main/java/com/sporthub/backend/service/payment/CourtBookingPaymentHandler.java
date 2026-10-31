package com.sporthub.backend.service.payment;

import com.sporthub.backend.entity.CourtBooking;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.service.EngagementService;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Handle COURT booking payment confirmation
 */
@Component
public class CourtBookingPaymentHandler implements BookingPaymentHandler {
    
    private final CourtBookingRepository courtBookingRepository;
    private final EngagementService engagementService;
    
    public CourtBookingPaymentHandler(
            CourtBookingRepository courtBookingRepository,
            EngagementService engagementService) {
        this.courtBookingRepository = courtBookingRepository;
        this.engagementService = engagementService;
    }
    
    @Override
    public String getSupportedBookingType() {
        return "COURT";
    }
    
    @Override
    public Map<String, Object> handlePaymentConfirmation(PaymentTransaction payment, Double transferAmount) {
        Long paymentId = payment.getPaymentId();
        CourtBooking courtBooking = courtBookingRepository.findByPaymentId(paymentId);
        
        if (courtBooking == null) {
            return null; // Not our booking type
        }
        
        // Rule 9: Check if booking already CANCELLED (late payment)
        if ("CANCELLED".equalsIgnoreCase(courtBooking.getStatus())) {
            System.out.println("⚠ COURT Booking #" + courtBooking.getCourtBookingId() + " already CANCELLED (late payment)");
            if (engagementService != null) {
                engagementService.notifyUser(
                    courtBooking.getMemberId(), "Thanh toán đến muộn",
                    "Đặt sân #" + courtBooking.getCourtBookingId() + " đã bị hủy do quá hạn. Vui lòng liên hệ quầy để được hoàn tiền.", "PAYMENT"
                );
            }
        } else {
            // Update court booking status to CONFIRMED
            courtBooking.setStatus("CONFIRMED");
            courtBookingRepository.save(courtBooking);
            System.out.println("✓✓✓ COURT Booking #" + courtBooking.getCourtBookingId() + " confirmed");
            
            // Send success notification
            if (engagementService != null) {
                engagementService.audit(
                    courtBooking.getMemberId(), "MEMBER", "SEPAY_PAYMENT_CONFIRMED",
                    "courtBookingId=" + courtBooking.getCourtBookingId() + ", paymentId=" + paymentId +
                    ", amount=" + transferAmount
                );
                engagementService.notifyUser(
                    courtBooking.getMemberId(), "Thanh toán thành công",
                    "Đã nhận thanh toán cho đặt sân #" + courtBooking.getCourtBookingId(), "PAYMENT"
                );
            }
        }
        
        return Map.of(
            "success", true, 
            "paymentId", paymentId, 
            "bookingType", "COURT", 
            "courtBookingId", courtBooking.getCourtBookingId()
        );
    }
}
