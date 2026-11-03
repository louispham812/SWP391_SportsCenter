package com.sporthub.backend.service.payment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.sporthub.backend.dto.PaymentConfirmationResult;
import com.sporthub.backend.entity.CourtBooking;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.service.EngagementService;

/**
 * Handle COURT booking payment confirmation
 */
@Component
public class CourtBookingPaymentHandler implements BookingPaymentHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(CourtBookingPaymentHandler.class);
    
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
    @Transactional
    public PaymentConfirmationResult handlePaymentConfirmation(PaymentTransaction payment, Double transferAmount) {
        Long paymentId = payment.getPaymentId();
        CourtBooking courtBooking = courtBookingRepository.findByPaymentId(paymentId);
        
        if (courtBooking == null) {
            return null; // Not our booking type
        }
        
        // Rule 9: Check if booking already CANCELLED (late payment)
        if ("CANCELLED".equalsIgnoreCase(courtBooking.getStatus())) {
            logger.warn("COURT Booking #{} already CANCELLED (late payment)", courtBooking.getCourtBookingId());
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
            logger.info("COURT Booking #{} confirmed", courtBooking.getCourtBookingId());
            
            // Send success notification
            if (engagementService != null) {
                engagementService.audit(
                    courtBooking.getMemberId(), "MEMBER", "PAYMENT_CONFIRMED",
                    "courtBookingId=" + courtBooking.getCourtBookingId() + ", paymentId=" + paymentId +
                    ", amount=" + transferAmount
                );
                engagementService.notifyUser(
                    courtBooking.getMemberId(), "Thanh toán thành công",
                    "Đã nhận thanh toán cho đặt sân #" + courtBooking.getCourtBookingId(), "PAYMENT"
                );
            }
        }
        
        PaymentConfirmationResult result = new PaymentConfirmationResult();
        result.setSuccess(true);
        result.setPaymentId(paymentId);
        result.setBookingType("COURT");
        result.setBookingId(courtBooking.getCourtBookingId());
        result.setStatus(courtBooking.getStatus());
        result.setMessage("Đặt sân đã được xác nhận");
        return result;
    }
}
