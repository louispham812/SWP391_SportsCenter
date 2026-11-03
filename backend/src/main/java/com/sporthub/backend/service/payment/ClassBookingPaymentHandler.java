package com.sporthub.backend.service.payment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.sporthub.backend.dto.PaymentConfirmationResult;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.service.EngagementService;

/**
 * Handle CLASS booking payment confirmation
 */
@Component
public class ClassBookingPaymentHandler implements BookingPaymentHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(ClassBookingPaymentHandler.class);
    
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
    @Transactional
    public PaymentConfirmationResult handlePaymentConfirmation(PaymentTransaction payment, Double transferAmount) {
        Long paymentId = payment.getPaymentId();
        Booking classBooking = bookingRepository.findByPaymentId(paymentId);
        
        if (classBooking == null) {
            return null; // Not our booking type
        }
        
        // Rule 9: Check if booking already CANCELLED (late payment)
        if ("CANCELLED".equalsIgnoreCase(classBooking.getStatus())) {
            logger.warn("CLASS Booking #{} already CANCELLED (late payment)", classBooking.getBookingId());
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
            logger.info("CLASS Booking #{} confirmed", classBooking.getBookingId());
            
            // Send success notification
            if (engagementService != null) {
                engagementService.audit(
                    classBooking.getMemberId(), "MEMBER", "PAYMENT_CONFIRMED",
                    "bookingId=" + classBooking.getBookingId() + ", paymentId=" + paymentId +
                    ", amount=" + transferAmount
                );
                engagementService.notifyUser(
                    classBooking.getMemberId(), "Thanh toán thành công",
                    "Đã nhận thanh toán cho lớp học #" + classBooking.getBookingId(), "PAYMENT"
                );
            }
        }
        
        return PaymentConfirmationResult.builder()
            .success(true)
            .paymentId(paymentId)
            .bookingType("CLASS")
            .bookingId(classBooking.getBookingId())
            .status(classBooking.getStatus())
            .message("CLASS booking confirmed")
            .build();
    }
}
