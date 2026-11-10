package com.sporthub.backend.service;

import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LatePaymentService {
    private final RefundRequestRepository refunds;
    private final UserRepository users;
    private final EngagementService engagement;
    public LatePaymentService(RefundRequestRepository refunds, UserRepository users, EngagementService engagement) {
        this.refunds = refunds; this.users = users; this.engagement = engagement;
    }
    @Transactional
    public void requestRefund(PaymentTransaction payment, Long bookingId, String type) {
        if (refunds.existsByTransactionIdAndStatusIn(payment.getPaymentId(), List.of("PENDING", "PENDING_APPROVAL", "APPROVED"))) return;
        User member = users.findById(payment.getMemberId()).orElseThrow();
        refunds.save(RefundRequest.builder().memberId(member.getUserId()).memberName(member.getFullName()).phone(member.getPhone())
            .transactionId(payment.getPaymentId()).referenceCode(payment.getReferenceCode()).bookingId(bookingId).bookingType(type)
            .refundAmount(payment.getAmount()).reason("Thanh toán đến sau khi hết giữ chỗ hoặc lịch không còn khả dụng").status("PENDING_APPROVAL").createdAt(LocalDateTime.now()).build());
        engagement.notifyUser(member.getUserId(), "Đã nhận tiền sau khi hết giữ chỗ", "Lịch không được xác nhận. Yêu cầu hoàn toàn bộ tiền đã được tạo để xử lý.", "REFUND");
    }
}
