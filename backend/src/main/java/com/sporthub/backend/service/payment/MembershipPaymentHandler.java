package com.sporthub.backend.service.payment;

import com.sporthub.backend.dto.PaymentConfirmationResult;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.service.EngagementService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MembershipPaymentHandler implements BookingPaymentHandler {
    private final UserMembershipRepository memberships;
    private final ReceptionPaymentRepository receipts;
    private final EngagementService engagement;
    public MembershipPaymentHandler(ReceptionPaymentRepository receipts, UserMembershipRepository memberships, EngagementService engagement) {
        this.receipts = receipts; this.memberships = memberships; this.engagement = engagement;
    }
    @Override public String getSupportedBookingType() { return "MEMBERSHIP_PACKAGE"; }
    @Override @Transactional
    public PaymentConfirmationResult handlePaymentConfirmation(PaymentTransaction payment, Double amount) {
        if (!"PAID".equals(payment.getPaymentStatus())) throw new IllegalStateException("Giao dịch chưa được thanh toán.");
        if (!"MEMBERSHIP_PACKAGE".equals(payment.getBookingType())) return null;
        if (payment.getMembershipId() == null) throw new IllegalStateException("Giao dịch chưa liên kết gói tập; cần đối soát tại quầy.");
        UserMembership membership = memberships.findByIdForUpdate(payment.getMembershipId()).orElseThrow();
        if (!membership.getUserId().equals(payment.getMemberId())) throw new IllegalStateException("Sai chủ sở hữu gói tập.");
        if ("PENDING_PAYMENT".equals(membership.getStatus()) && "PAID".equals(payment.getPaymentStatus())) {
            membership.setStatus("PENDING_APPROVAL"); memberships.save(membership);
            receipts.findByMemberIdOrderByCreatedAtDesc(Math.toIntExact(payment.getMemberId())).stream()
                .filter(r -> r.getMembershipId() != null && r.getMembershipId().longValue() == membership.getMembershipId())
                .forEach(r -> { r.setPaymentStatus("COMPLETED"); receipts.save(r); });
            engagement.notifyUser(payment.getMemberId(), "Đã nhận thanh toán gói tập", "Gói tập đang chờ Quản lý phê duyệt.", "MEMBERSHIP");
        }
        PaymentConfirmationResult result = new PaymentConfirmationResult();
        result.setSuccess(true); result.setPaymentId(payment.getPaymentId()); result.setMembershipId(membership.getMembershipId());
        result.setBookingType("MEMBERSHIP_PACKAGE"); result.setStatus(membership.getStatus()); return result;
    }
}
