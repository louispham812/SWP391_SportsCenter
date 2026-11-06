package com.sporthub.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
import com.sporthub.backend.service.EngagementService;

@RestController
@CrossOrigin(origins = "*")
public class RefundRequestController {
    
    private static final Logger logger = LoggerFactory.getLogger(RefundRequestController.class);

    private final RefundRequestRepository refundRepository;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ReceptionPaymentRepository paymentRepository;
    private final EngagementService engagementService;
    private final com.sporthub.backend.service.gateway.VNPayGateway vnpayGateway;
    private final com.sporthub.backend.service.BookingService bookingService;
    private final com.sporthub.backend.service.MembershipService membershipService;

    @Autowired(required = false)
    private com.sporthub.backend.repository.BookingRepository bookingRepository;

    @Autowired(required = false)
    private com.sporthub.backend.repository.CourtBookingRepository courtBookingRepository;

    @Autowired
    public RefundRequestController(
            RefundRequestRepository refundRepository,
            UserRepository userRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            ReceptionPaymentRepository paymentRepository,
            EngagementService engagementService,
            com.sporthub.backend.service.gateway.VNPayGateway vnpayGateway,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.sporthub.backend.service.BookingService bookingService,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.sporthub.backend.service.MembershipService membershipService) {
        this.refundRepository = refundRepository;
        this.userRepository = userRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.paymentRepository = paymentRepository;
        this.engagementService = engagementService;
        this.vnpayGateway = vnpayGateway;
        this.bookingService = bookingService;
        this.membershipService = membershipService;
    }

    public RefundRequestController(
            RefundRequestRepository refundRepository,
            UserRepository userRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            ReceptionPaymentRepository paymentRepository,
            EngagementService engagementService,
            com.sporthub.backend.service.gateway.VNPayGateway vnpayGateway) {
        this(refundRepository, userRepository, paymentTransactionRepository, paymentRepository, engagementService, vnpayGateway, null, null);
    }

    public RefundRequestController(
            RefundRequestRepository refundRepository,
            UserRepository userRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            ReceptionPaymentRepository paymentRepository) {
        this(refundRepository, userRepository, paymentTransactionRepository, paymentRepository, null, null, null, null);
    }

    public RefundRequestController(
            RefundRequestRepository refundRepository,
            UserRepository userRepository) {
        this(refundRepository, userRepository, null, null, null, null, null, null);
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
                            && ("PENDING_APPROVAL".equalsIgnoreCase(r.getStatus()) || "APPROVED".equalsIgnoreCase(r.getStatus())));
            if (alreadyProcessedOrPending) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch này đang có một yêu cầu hoàn tiền đang xử lý hoặc đã được duyệt (BR-20).");
            }
        }
        if (req.referenceCode() != null && !req.referenceCode().isBlank()) {
            boolean alreadyProcessedOrPending = refundRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
                    .anyMatch(r -> req.referenceCode().equalsIgnoreCase(r.getReferenceCode())
                            && ("PENDING_APPROVAL".equalsIgnoreCase(r.getStatus()) || "APPROVED".equalsIgnoreCase(r.getStatus())));
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

        Long bookingId = null;
        String bookingType = null;
        if (origTx != null) {
            bookingType = origTx.getBookingType();
            Long txPaymentId = origTx.getPaymentId();
            if ("CLASS".equalsIgnoreCase(bookingType) && bookingRepository != null) {
                com.sporthub.backend.entity.Booking b = bookingRepository.findByPaymentId(txPaymentId);
                if (b != null) bookingId = b.getBookingId();
            } else if ("COURT".equalsIgnoreCase(bookingType) && courtBookingRepository != null) {
                com.sporthub.backend.entity.CourtBooking cb = courtBookingRepository.findByPaymentId(txPaymentId);
                if (cb != null) bookingId = cb.getCourtBookingId();
            }
        }

        RefundRequest refund = RefundRequest.builder()
                .memberId(memberId)
                .memberName(user.getFullName())
                .phone(user.getPhone() != null ? user.getPhone() : user.getEmail())
                .transactionId(origTx != null ? origTx.getPaymentId() : req.transactionId())
                .referenceCode(origTx != null ? origTx.getReferenceCode() : req.referenceCode())
                .bookingId(bookingId)
                .bookingType(bookingType)
                .bookingDescription(req.bookingDescription())
                .refundAmount(req.refundAmount())
                .reason(req.reason().trim())
                .bankName(req.bankName())
                .bankAccount(req.bankAccount())
                .accountHolder(req.accountHolder())
                .status("PENDING_APPROVAL")
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

        if (!"PENDING_APPROVAL".equalsIgnoreCase(refund.getStatus()) && !"PENDING".equalsIgnoreCase(refund.getStatus())) {
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
            logger.info("🟢 REFUND APPROVED - Starting process...");
            logger.info("  Refund ID: {}", refund.getRefundId());
            logger.info("  Transaction ID: {}", refund.getTransactionId());
            logger.info("  Reference Code: {}", refund.getReferenceCode());
            logger.info("  paymentTransactionRepository null? {}", paymentTransactionRepository == null);
            logger.info("  vnpayGateway null? {}", vnpayGateway == null);
            
            PaymentTransaction tx = null;
            if (paymentTransactionRepository != null) {
                if (refund.getTransactionId() != null) {
                    tx = paymentTransactionRepository.findById(refund.getTransactionId()).orElse(null);
                }
                if (tx == null && refund.getReferenceCode() != null && !refund.getReferenceCode().isBlank()) {
                    tx = paymentTransactionRepository.findAll().stream()
                            .filter(t -> refund.getReferenceCode().equalsIgnoreCase(t.getReferenceCode()))
                            .findFirst()
                            .orElse(null);
                }
            }

            if (tx != null) {
                if (refund.getTransactionId() == null) {
                    refund.setTransactionId(tx.getPaymentId());
                }
                if (refund.getBookingType() == null) {
                    refund.setBookingType(tx.getBookingType());
                }
                if (refund.getBookingId() == null) {
                    if ("CLASS".equalsIgnoreCase(tx.getBookingType()) && bookingRepository != null) {
                        com.sporthub.backend.entity.Booking b = bookingRepository.findByPaymentId(tx.getPaymentId());
                        if (b != null) refund.setBookingId(b.getBookingId());
                    } else if ("COURT".equalsIgnoreCase(tx.getBookingType()) && courtBookingRepository != null) {
                        com.sporthub.backend.entity.CourtBooking cb = courtBookingRepository.findByPaymentId(tx.getPaymentId());
                        if (cb != null) refund.setBookingId(cb.getCourtBookingId());
                    }
                }

                // ✅ Call VNPay Refund API if original payment was via VNPay
                if (com.sporthub.backend.constants.PaymentConstants.METHOD_VNPAY.equals(tx.getPaymentMethod()) && vnpayGateway != null) {
                    logger.info(">>> ✅ CALLING VNPAY REFUND API <<<");
                    try {
                        Map<String, Object> refundResult = vnpayGateway.refundPayment(
                                tx,
                                refund.getRefundAmount(),
                                refund.getReason()
                        );
                        String responseCode = (String) refundResult.get("vnp_ResponseCode");
                        if ("00".equals(responseCode)) {
                            logger.info("✅ VNPay refund SUCCESS");
                        } else {
                            refund.setDecisionNote((refund.getDecisionNote() != null ? refund.getDecisionNote() : "") 
                                    + " | VNPay refund failed: " + refundResult.get("vnp_Message"));
                            logger.warn("❌ VNPay refund FAILED: {}", responseCode);
                        }
                    } catch (Exception e) {
                        logger.error("❌ VNPay refund ERROR: ", e);
                        refund.setDecisionNote((refund.getDecisionNote() != null ? refund.getDecisionNote() : "") 
                                + " | VNPay refund error: " + e.getMessage());
                    }
                } else {
                    logger.info("Payment method is not VNPay or gateway is null. Direct refund update.");
                }

                tx.setPaymentStatus("REFUNDED");
                paymentTransactionRepository.save(tx);
            } else {
                logger.warn("⚠️ Transaction not found for ID: {} or Ref: {}", refund.getTransactionId(), refund.getReferenceCode());
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

            // 🔥 When Manager approves refund -> Cancel Booking/Membership
            if (refund.getBookingId() != null && refund.getBookingType() != null) {
                String bookingType = refund.getBookingType();

                // LUỒNG 1: Cancel CLASS/COURT booking
                if (("CLASS".equalsIgnoreCase(bookingType) || "COURT".equalsIgnoreCase(bookingType)) 
                    && bookingService != null) {
                    try {
                        logger.info("🔥 Calling cancelBookingAfterRefund - bookingId: {}, bookingType: {}", 
                            refund.getBookingId(), bookingType);
                        bookingService.cancelBookingAfterRefund(
                            refund.getBookingId(), 
                            bookingType, 
                            refund.getRefundId()
                        );
                    } catch (Exception e) {
                        logger.error("❌ Cancel booking error: ", e);
                        refund.setDecisionNote((refund.getDecisionNote() != null ? refund.getDecisionNote() : "") 
                                + " | Cancel booking error: " + e.getMessage());
                    }
                }
                
                // LUỒNG 2: Cancel MEMBERSHIP
                else if ("MEMBERSHIP".equalsIgnoreCase(bookingType) && membershipService != null) {
                    try {
                        logger.info("🔥 Calling cancelMembershipAfterRefund - membershipId: {}", 
                            refund.getBookingId());
                        membershipService.cancelMembershipAfterRefund(
                            refund.getBookingId(),  // bookingId contains membershipId
                            refund.getRefundId()
                        );
                    } catch (Exception e) {
                        logger.error("❌ Cancel membership error: ", e);
                        refund.setDecisionNote((refund.getDecisionNote() != null ? refund.getDecisionNote() : "") 
                                + " | Cancel membership error: " + e.getMessage());
                    }
                }
            } else {
                logger.warn("⚠️ Missing bookingId or bookingType - Cannot cancel booking");
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
