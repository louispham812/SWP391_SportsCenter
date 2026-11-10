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
    @org.springframework.beans.factory.annotation.Autowired private com.sporthub.backend.repository.SportsCourtRepository courts;
    @org.springframework.beans.factory.annotation.Autowired private com.sporthub.backend.repository.CourtMaintenanceRepository maintenance;
    @org.springframework.beans.factory.annotation.Autowired private com.sporthub.backend.service.LatePaymentService latePayments;
    
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
        
        if (courts != null) courts.findByIdForUpdate(courtBooking.getCourtId()).orElseThrow();
        courtBooking = courtBookingRepository.findByIdForUpdate(courtBooking.getCourtBookingId()).orElseThrow();
        if ("CONFIRMED".equals(courtBooking.getStatus()) || "CHECKED_IN".equals(courtBooking.getStatus())) return confirmation(payment, courtBooking);
        boolean unavailable = !"PENDING".equals(courtBooking.getStatus()) || courtBooking.getCreatedAt() == null
            || !courtBooking.getCreatedAt().plusMinutes(10).isAfter(java.time.LocalDateTime.now())
            || courtBookingRepository.existsConfirmedOverlapExcluding(courtBooking.getCourtId(), courtBooking.getCourtBookingId(), courtBooking.getStartTime(), courtBooking.getEndTime())
            || (maintenance != null && maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(courtBooking.getCourtId(), courtBooking.getEndTime(), courtBooking.getStartTime()));
        if (unavailable) {
            courtBooking.setStatus("CANCELLED"); courtBookingRepository.save(courtBooking);
            if (latePayments != null) latePayments.requestRefund(payment, courtBooking.getCourtBookingId(), "COURT");
            return confirmation(payment, courtBooking);
        }
        courtBooking.setStatus("CONFIRMED"); courtBookingRepository.save(courtBooking);
        if (engagementService != null) {
            engagementService.audit(courtBooking.getMemberId(), "MEMBER", "PAYMENT_CONFIRMED", "courtBookingId=" + courtBooking.getCourtBookingId() + ", paymentId=" + paymentId);
            engagementService.notifyUser(courtBooking.getMemberId(), "Thanh toán thành công", "Đặt sân đã được xác nhận.", "PAYMENT");
        }
        return confirmation(payment, courtBooking);
    }
    private PaymentConfirmationResult confirmation(PaymentTransaction payment, CourtBooking courtBooking) {
        PaymentConfirmationResult result = new PaymentConfirmationResult();
        result.setSuccess(!"CANCELLED".equals(courtBooking.getStatus()));
        result.setPaymentId(payment.getPaymentId());
        result.setBookingType("COURT");
        result.setBookingId(courtBooking.getCourtBookingId());
        result.setStatus(courtBooking.getStatus());
        result.setMessage("Đặt sân đã được xác nhận");
        return result;
    }
}
