package com.sporthub.backend.service;

import com.sporthub.backend.entity.MembershipPackage;
import com.sporthub.backend.entity.RefundRequest;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.UserMembership;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.RefundRequestRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Service xử lý tạo refund request - tái sử dụng logic chung
 * BR-20: Refund Request Creation & Validation
 */
@Service
public class RefundService {

    private final RefundRequestRepository refundRequestRepository;
    private final UserRepository userRepository;
    private final MembershipPackageRepository membershipPackageRepository;
    private final EngagementService engagementService;

    public RefundService(
            RefundRequestRepository refundRequestRepository,
            UserRepository userRepository,
            MembershipPackageRepository membershipPackageRepository,
            EngagementService engagementService) {
        this.refundRequestRepository = refundRequestRepository;
        this.userRepository = userRepository;
        this.membershipPackageRepository = membershipPackageRepository;
        this.engagementService = engagementService;
    }

    /**
     * Tạo refund request với auto-approval
     * Dùng cho trường hợp system tự động hoàn tiền 100% (reject membership, cancel booking đúng hạn)
     * 
     * @param memberId User ID cần hoàn tiền
     * @param amount Số tiền hoàn
     * @param reason Lý do hoàn tiền
     * @param approvedBy Manager ID (nếu có)
     * @param transactionId ID giao dịch gốc (nullable)
     * @param referenceCode Mã tham chiếu (nullable)
     * @return RefundRequest đã được lưu
     */
    @Transactional
    public RefundRequest createAutoApprovedRefund(
            Long memberId,
            BigDecimal amount,
            String reason,
            Long approvedBy,
            Long transactionId,
            String referenceCode) {
        
        // Validate parameters
        if (memberId == null) {
            throw new IllegalArgumentException("Member ID không được null");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền hoàn phải lớn hơn 0");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Lý do hoàn tiền không được để trống");
        }

        // Get user info
        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Không tìm thấy người dùng ID: " + memberId));

        // Create refund request with auto-approval
        RefundRequest refund = RefundRequest.builder()
                .memberId(memberId)
                .memberName(user.getFullName())
                .phone(user.getPhone() != null ? user.getPhone() : user.getEmail())
                .transactionId(transactionId)
                .referenceCode(referenceCode)
                .refundAmount(amount)
                .reason(reason.trim())
                .status("APPROVED")  // Auto-approve
                .approvedBy(approvedBy)
                .createdAt(LocalDateTime.now())
                .build();

        RefundRequest saved = refundRequestRepository.save(refund);

        // Send notification
        if (engagementService != null) {
            engagementService.notifyUser(
                memberId,
                "Yêu cầu hoàn tiền đã được duyệt",
                String.format("Yêu cầu hoàn tiền %,.0f VNĐ đã được duyệt tự động. Lý do: %s. " +
                        "Tiền sẽ được chuyển về tài khoản trong 3-5 ngày làm việc.",
                        amount, reason),
                "REFUND"
            );
        }

        return saved;
    }

    /**
     * Tạo refund request 100% cho membership bị reject
     * 
     * @param membership UserMembership bị reject
     * @param rejectReason Lý do từ chối
     * @param managerId Manager ID người từ chối
     * @return RefundRequest đã được tạo và auto-approved
     */
    @Transactional
    public RefundRequest createRefundForRejectedMembership(
            UserMembership membership,
            String rejectReason,
            Long managerId) {
        
        // Get package info to get price
        MembershipPackage pkg = membershipPackageRepository.findById(membership.getPackageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                    "Package không tồn tại"));

        // Create reason message
        String refundReason = String.format(
                "Hoàn tiền 100%% do gói tập '%s' (ID: %d) bị từ chối bởi Quản lý. Lý do từ chối: %s",
                pkg.getName(),
                membership.getMembershipId(),
                rejectReason
        );

        // Create auto-approved refund
        return createAutoApprovedRefund(
                membership.getUserId(),
                pkg.getPrice(),
                refundReason,
                managerId,
                null,  // transactionId - có thể link sau nếu cần
                String.format("MBR-%d", membership.getMembershipId())  // referenceCode
        );
    }
}
