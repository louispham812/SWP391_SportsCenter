package com.sporthub.backend.service.payment;

import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.ReceptionPayment;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.service.EngagementService;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Handle MEMBERSHIP_PACKAGE payment confirmation
 * Auto-activates membership: PENDING_APPROVAL → ACTIVE
 */
@Component
public class MembershipPaymentHandler implements BookingPaymentHandler {
    
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
    public Map<String, Object> handlePaymentConfirmation(PaymentTransaction payment, Double transferAmount) {
        Long paymentId = payment.getPaymentId();
        
        if (!"MEMBERSHIP_PACKAGE".equalsIgnoreCase(payment.getBookingType())) {
            return null; // Not our booking type
        }
        
        System.out.println(">>> Processing MEMBERSHIP_PACKAGE payment...");
        
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
                
                // Find and update UserMembership
                UserMembership membership = userMembershipRepository.findById(membershipId).orElse(null);
                
                if (membership != null) {
                    // Update status from PENDING_APPROVAL to ACTIVE (auto-activation)
                    if ("PENDING_APPROVAL".equalsIgnoreCase(membership.getStatus())) {
                        membership.setStatus("ACTIVE");
                        userMembershipRepository.save(membership);
                        System.out.println("✓✓✓ UserMembership #" + membershipId + " activated (PENDING_APPROVAL → ACTIVE)");
                        
                        // Send success notification
                        if (engagementService != null) {
                            engagementService.audit(
                                payment.getMemberId(), "MEMBER", "SEPAY_MEMBERSHIP_CONFIRMED",
                                "membershipId=" + membershipId + ", paymentId=" + paymentId +
                                ", amount=" + transferAmount
                            );
                            engagementService.notifyUser(
                                payment.getMemberId(), "Kích hoạt gói tập thành công",
                                "Gói hội viên của bạn đã được kích hoạt. Mã thẻ: #" + membershipId, "PAYMENT"
                            );
                        }
                        
                        return Map.of(
                            "success", true, 
                            "paymentId", paymentId, 
                            "bookingType", "MEMBERSHIP_PACKAGE", 
                            "membershipId", membershipId
                        );
                    } else {
                        System.out.println("⚠ UserMembership #" + membershipId + " already has status: " + membership.getStatus());
                    }
                } else {
                    System.out.println("⚠ UserMembership #" + membershipId + " not found");
                }
            } else {
                System.out.println("⚠ No matching ReceptionPayment found for memberId: " + payment.getMemberId());
            }
        } catch (Exception e) {
            System.out.println("⚠ Error processing MEMBERSHIP_PACKAGE: " + e.getMessage());
            e.printStackTrace();
        }
        
        return null; // Failed to process
    }
}
