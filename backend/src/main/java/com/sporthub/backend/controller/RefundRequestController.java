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

    @Autowired
    public RefundRequestController(
            RefundRequestRepository refundRepository,
            UserRepository userRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            ReceptionPaymentRepository paymentRepository) {
        this.refundRepository = refundRepository;
        this.userRepository = userRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.paymentRepository = paymentRepository;
    }

    public RefundRequestController(
            RefundRequestRepository refundRepository,
            UserRepository userRepository) {
        this(refundRepository, userRepository, null, null);
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

        RefundRequest refund = RefundRequest.builder()
                .memberId(memberId)
                .memberName(user.getFullName())
                .phone(user.getPhone() != null ? user.getPhone() : user.getEmail())
                .transactionId(req.transactionId())
                .referenceCode(req.referenceCode())
                .bookingDescription(req.bookingDescription())
                .refundAmount(req.refundAmount() == null ? BigDecimal.ZERO : req.refundAmount())
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

        Long managerId = getUserId(auth);
        refund.setStatus(decision.approved() ? "APPROVED" : "REJECTED");
        refund.setApprovedBy(managerId);
        if (decision.decisionNote() != null) {
            refund.setDecisionNote(decision.decisionNote());
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
