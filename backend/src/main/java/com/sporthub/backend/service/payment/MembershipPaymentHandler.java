package com.sporthub.backend.service.payment;

import java.time.Duration;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.sporthub.backend.dto.PaymentConfirmationResult;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.ReceptionPayment;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.service.EngagementService;

/**
 * Handle MEMBERSHIP_PACKAGE payment confirmation
 * 
 * NEW FLOW (PENDING_APPROVAL):
 * 1. User mua package → status = PENDING_PAYMENT
 * 2. Thanh toán thành công (VNPay/Cash) → status = PENDING_APPROVAL (GIỮ NGUYÊN, chờ Manager duyệt)
 * 3. Manager approve → MembershipService.approveMembership() → status = ACTIVE + Cấp quota
 * 4. Manager reject → MembershipService.rejectMembership() → status = REJECTED + Refund 100%
 * 
 * KHÔNG TỰ ĐỘNG KÍCH HOẠT (No auto-activation)
 */
@Component
public class MembershipPaymentHandler implements BookingPaymentHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(MembershipPaymentHandler.class);
    
    private final ReceptionPaymentRepository receptionPaymentRepository;
    private final UserMembershipRepository userMembershipRepository;
    private final EngagementService engagementService;
    
    public MembershipPaymentHandler(
            ReceptionPaymentRepository receptionPaymentRepository,
            UserMembershipRepository userMembershipRepository,
            EngagementService engagementService) {
        this.receptionPaymentRepository = receptionPaymentRepository;
        this.userMembershipRepository = userMembershipRepository;
        this.engagementService = engagementService;
    }
    
    @Override
    public String getSupportedBookingType() {
        return "MEMBERSHIP_PACKAGE";
    }
    
    @Override
    @Transactional
    public PaymentConfirmationResult handlePaymentConfirmation(PaymentTransaction payment, Double transferAmount) {
        Long paymentId = payment.getPaymentId();
        
        if (!"MEMBERSHIP_PACKAGE".equalsIgnoreCase(payment.getBookingType())) {
            return null; // Not our booking type
        }
        
        logger.info("Processing MEMBERSHIP_PACKAGE payment #{}", paymentId);
        
        try {
            // Find ReceptionPayment by memberId to get membershipId (um_id)
            List<ReceptionPayment> receptionPayments = 
                receptionPaymentRepository.findByMemberIdOrderByCreatedAtDesc(Math.toIntExact(payment.getMemberId()));
            
            ReceptionPayment matchingPayment = receptionPayments.stream()
                .filter(rp -> rp.getMembershipId() != null)
                .filter(rp -> rp.getCreatedAt() != null && payment.getCreatedAt() != null)
                .filter(rp -> Duration.between(rp.getCreatedAt(), payment.getCreatedAt()).abs().toMinutes() < 5)
                .findFirst()
                .orElse(null);
            
            if (matchingPayment != null && matchingPayment.getMembershipId() != null) {
                Long membershipId = Long.valueOf(matchingPayment.getMembershipId());
                
                // Find UserMembership
                UserMembership membership = userMembershipRepository.findById(membershipId).orElse(null);
                
                if (membership != null) {
                    // ✅ NEW FLOW: GIỮ NGUYÊN PENDING_APPROVAL, KHÔNG auto-activate
                    // Manager sẽ approve/reject sau
                    if ("PENDING_APPROVAL".equalsIgnoreCase(membership.getStatus())) {
                        // Update ReceptionPayment status to COMPLETED (payment confirmed)
                        matchingPayment.setPaymentStatus("COMPLETED");
                        receptionPaymentRepository.save(matchingPayment);
                        
                        logger.info("✅ MEMBERSHIP PAYMENT CONFIRMED: Membership #{} stays in PENDING_APPROVAL (waiting for Manager approval)", membershipId);
                        
                        // Send notification: Payment success, chờ Manager duyệt
                        if (engagementService != null) {
                            engagementService.audit(
                                payment.getMemberId(), "MEMBER", "MEMBERSHIP_PAYMENT_CONFIRMED",
                                "membershipId=" + membershipId + ", paymentId=" + paymentId +
                                ", amount=" + transferAmount + ", status=PENDING_APPROVAL"
                            );
                            engagementService.notifyUser(
                                payment.getMemberId(), 
                                "Thanh toán gói thành công",
                                "Gói hội viên #" + membershipId + " của bạn đã được thanh toán thành công! " +
                                "Hệ thống đang chờ Quản lý phê duyệt để kích hoạt gói tập.", 
                                "PAYMENT"
                            );
                        }
                        
                        PaymentConfirmationResult result = new PaymentConfirmationResult();
                        result.setSuccess(true);
                        result.setPaymentId(paymentId);
                        result.setBookingType("MEMBERSHIP_PACKAGE");
                        result.setMembershipId(membershipId);
                        result.setStatus("PENDING_APPROVAL");
                        result.setMessage("Thanh toán thành công. Đang chờ quản lý phê duyệt.");
                        return result;
                    } else {
                        logger.warn("UserMembership #{} already has status: {}", membershipId, membership.getStatus());
                    }
                } else {
                    logger.warn("UserMembership #{} not found", membershipId);
                }
            } else {
                logger.warn("No matching ReceptionPayment found for memberId: {}", payment.getMemberId());
            }
        } catch (Exception e) {
            logger.error("Error processing MEMBERSHIP_PACKAGE payment #{}: {}", paymentId, e.getMessage(), e);
        }
        
        return null; // Failed to process
    }
}
