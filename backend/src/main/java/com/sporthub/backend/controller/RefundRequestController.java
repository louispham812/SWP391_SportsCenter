package com.sporthub.backend.controller;

import com.sporthub.backend.dto.CreateRefundRequest;
import com.sporthub.backend.dto.RefundDecisionRequest;
import com.sporthub.backend.dto.RefundRequestDTO;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.RefundRequest;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.RefundRequestRepository;
import com.sporthub.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.sporthub.backend.service.EngagementService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class RefundRequestController {

    private final RefundRequestRepository refundRepository;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ReceptionPaymentRepository paymentRepository;
    private final EngagementService engagementService;

    @Autowired
    public RefundRequestController(
            RefundRequestRepository refundRepository,
            UserRepository userRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            ReceptionPaymentRepository paymentRepository,
            EngagementService engagementService) {
        this.refundRepository = refundRepository;
        this.userRepository = userRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.paymentRepository = paymentRepository;
        this.engagementService = engagementService;
    }

    public RefundRequestController(
            RefundRequestRepository refundRepository,
            UserRepository userRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            ReceptionPaymentRepository paymentRepository) {
        this(refundRepository, userRepository, paymentTransactionRepository, paymentRepository, null);
    }

    public RefundRequestController(
            RefundRequestRepository refundRepository,
            UserRepository userRepository) {
        this(refundRepository, userRepository, null, null, null);
    }

    @GetMapping("/api/v1/members/me/refunds")
    @Transactional(readOnly = true)
    public ResponseEntity<List<RefundRequestDTO>> getMyRefunds(Authentication auth) {
        Long memberId = getUserId(auth);
        return ResponseEntity.ok(refundRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream().map(this::toDTO).toList());
    }

    @PostMapping("/api/v1/members/me/refunds")
    @Transactional
    public ResponseEntity<RefundRequestDTO> createRefundRequest(
            @RequestBody CreateRefundRequest req,
            Authentication auth) {
        Long memberId = getUserId(auth);
        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));

        if (req.reason() == null || req.reason().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lý do hoàn tiền không được để trống.");
        }

        if (req.refundAmount() == null || req.refundAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền hoàn phải lớn hơn 0 (BR-20).");
        }

        if (req.transactionId() != null) {
            boolean alreadyProcessedOrPending = refundRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
                    .anyMatch(r -> req.transactionId().equals(r.getTransactionId())
                            && ("PENDING".equalsIgnoreCase(r.getStatus()) || "APPROVED".equalsIgnoreCase(r.getStatus())));
            if (alreadyProcessedOrPending) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch này đang có một yêu cầu hoàn tiền đang xử lý hoặc đã được duyệt (BR-20).");
            }
        }
        if (req.referenceCode() != null && !req.referenceCode().isBlank()) {
            boolean alreadyProcessedOrPending = refundRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
                    .anyMatch(r -> req.referenceCode().equalsIgnoreCase(r.getReferenceCode())
                            && ("PENDING".equalsIgnoreCase(r.getStatus()) || "APPROVED".equalsIgnoreCase(r.getStatus())));
            if (alreadyProcessedOrPending) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã giao dịch này đang có một yêu cầu hoàn tiền đang xử lý hoặc đã được duyệt (BR-20).");
            }
        }

        // Kiểm tra đối chiếu với giao dịch gốc
        PaymentTransaction origTx = null;
        if (paymentTransactionRepository != null) {
            if (req.transactionId() != null) {
                origTx = paymentTransactionRepository.findById(req.transactionId()).orElse(null);
            }
            if (origTx == null && req.referenceCode() != null && !req.referenceCode().isBlank()) {
                origTx = paymentTransactionRepository.findAll().stream()
                        .filter(tx -> req.referenceCode().equalsIgnoreCase(tx.getReferenceCode()))
                        .findFirst()
                        .orElse(null);
            }
        }
        if (origTx != null) {
            if ("REFUNDED".equalsIgnoreCase(origTx.getPaymentStatus())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch này đã được hoàn tiền trước đó (BR-20).");
            }
            if (origTx.getAmount() != null && req.refundAmount().compareTo(origTx.getAmount()) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền hoàn không được vượt quá số tiền đã thanh toán (BR-20).");
            }
        }

        RefundRequest refund = RefundRequest.builder()
                .memberId(memberId)
                .memberName(user.getFullName())
                .phone(user.getPhone() != null ? user.getPhone() : user.getEmail())
                .transactionId(req.transactionId())
                .referenceCode(req.referenceCode())
                .bookingDescription(req.bookingDescription())
                .refundAmount(req.refundAmount())
                .reason(req.reason().trim())
                .bankName(req.bankName())
                .bankAccount(req.bankAccount())
                .accountHolder(req.accountHolder())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(refundRepository.save(refund)));
    }

    @GetMapping("/api/v1/manager/refunds")
    @Transactional(readOnly = true)
    public ResponseEntity<List<RefundRequestDTO>> getAllRefundsForManager() {
        return ResponseEntity.ok(refundRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDTO).toList());
    }

    @PostMapping("/api/v1/manager/refunds/{id}/decision")
    @Transactional
    public ResponseEntity<RefundRequestDTO> decideRefund(
            @PathVariable Long id,
            @RequestBody RefundDecisionRequest decision,
            Authentication auth) {
        RefundRequest refund = refundRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu hoàn tiền."));

        if (!"PENDING".equalsIgnoreCase(refund.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Yêu cầu hoàn tiền này đã được xử lý trước đó.");
        }

        if (!decision.approved() && (decision.decisionNote() == null || decision.decisionNote().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Từ chối hoàn tiền phải ghi rõ lý do (BR-20)");
        }

        Long managerId = getUserId(auth);
        refund.setStatus(decision.approved() ? "APPROVED" : "REJECTED");
        refund.setApprovedBy(managerId);
        if (decision.decisionNote() != null) {
            refund.setDecisionNote(decision.decisionNote().trim());
        }

        if (decision.approved()) {
            if (paymentTransactionRepository != null) {
                if (refund.getTransactionId() != null) {
                    paymentTransactionRepository.findById(refund.getTransactionId()).ifPresent(tx -> {
                        tx.setPaymentStatus("REFUNDED");
                        paymentTransactionRepository.save(tx);
                    });
                }
                if (refund.getReferenceCode() != null && !refund.getReferenceCode().isBlank()) {
                    paymentTransactionRepository.findAll().stream()
                            .filter(tx -> refund.getReferenceCode().equalsIgnoreCase(tx.getReferenceCode()))
                            .findFirst()
                            .ifPresent(tx -> {
                                tx.setPaymentStatus("REFUNDED");
                                paymentTransactionRepository.save(tx);
                            });
                }
            }
            if (paymentRepository != null && refund.getTransactionId() != null) {
                try {
                    paymentRepository.findById(Math.toIntExact(refund.getTransactionId())).ifPresent(rp -> {
                        rp.setPaymentStatus("REFUNDED");
                        paymentRepository.save(rp);
                    });
                } catch (Exception ignored) {
                }
            }
        }

        if (engagementService != null) {
            // Send notification to member
            String notificationTitle = decision.approved() 
                    ? "Yêu cầu hoàn tiền đã được duyệt" 
                    : "Yêu cầu hoàn tiền bị từ chối";
            
            String notificationMessage = decision.approved()
                    ? String.format("Yêu cầu hoàn tiền %,.0f VNĐ đã được duyệt. " +
                            "Tiền sẽ được chuyển về tài khoản trong 3-5 ngày làm việc.",
                            refund.getRefundAmount().doubleValue())
                    : String.format("Yêu cầu hoàn tiền %,.0f VNĐ đã bị từ chối. Lý do: %s",
                            refund.getRefundAmount().doubleValue(),
                            decision.decisionNote() != null ? decision.decisionNote().trim() : "Không đủ điều kiện");
            
            engagementService.notifyUser(
                    refund.getMemberId(),
                    notificationTitle,
                    notificationMessage,
                    "REFUND"
            );

            // Audit log
            engagementService.audit(managerId, "MANAGER", "REFUND_DECIDED",
                    "refundId=" + id + ", status=" + refund.getStatus() +
                    ", amount=" + refund.getRefundAmount() +
                    ", memberId=" + refund.getMemberId() +
                    ", note=" + (decision.decisionNote() != null ? decision.decisionNote().trim() : ""));
        }

        return ResponseEntity.ok(toDTO(refundRepository.save(refund)));
    }

    private RefundRequestDTO toDTO(RefundRequest r) {
        return new RefundRequestDTO(
                r.getRefundId(),
                r.getMemberId(),
                r.getMemberName(),
                r.getPhone(),
                r.getTransactionId(),
                r.getReferenceCode(),
                r.getBookingDescription(),
                r.getRefundAmount(),
                r.getReason(),
                r.getBankName(),
                r.getBankAccount(),
                r.getAccountHolder(),
                r.getStatus(),
                r.getApprovedBy(),
                r.getDecisionNote(),
                r.getCreatedAt());
    }

    private Long getUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        try {
            return Long.valueOf(auth.getName());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ.");
        }
    }
}
