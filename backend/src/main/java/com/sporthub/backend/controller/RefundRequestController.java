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
    @Autowired(required = false)
    private com.sporthub.backend.repository.GatewayReceiptRepository gatewayReceipts;

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

        PaymentTransaction origTx = req.transactionId() == null ? null
            : paymentTransactionRepository.findByIdForUpdate(req.transactionId()).orElse(null);
        if (origTx == null && req.referenceCode() != null) {
            PaymentTransaction candidate = paymentTransactionRepository.findByReferenceCodeIgnoreCase(req.referenceCode()).orElse(null);
            if (candidate != null) origTx = paymentTransactionRepository.findByIdForUpdate(candidate.getPaymentId()).orElse(null);
        }
        if (origTx == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy giao dịch gốc.");
        if (!memberId.equals(origTx.getMemberId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Giao dịch không thuộc tài khoản của bạn.");
        if (!"PAID".equals(origTx.getPaymentStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch chưa thu tiền hoặc đã hoàn tiền.");
        if (req.refundAmount().compareTo(origTx.getAmount()) != 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ hoàn toàn bộ giao dịch đủ điều kiện.");
        if (refundRepository.existsByTransactionIdAndStatusIn(origTx.getPaymentId(), List.of("PENDING", "PENDING_APPROVAL", "APPROVED"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch đã có yêu cầu hoàn tiền.");
        }

        Long bookingId = null;
        String bookingType = null;
        if (origTx != null) {
            bookingType = origTx.getBookingType();
            Long txPaymentId = origTx.getPaymentId();
            if (("CLASS".equalsIgnoreCase(bookingType) || "PT".equalsIgnoreCase(bookingType)) && bookingRepository != null) {
                com.sporthub.backend.entity.Booking b = bookingRepository.findByPaymentId(txPaymentId);
                if (b != null) bookingId = b.getBookingId();
            } else if ("COURT".equalsIgnoreCase(bookingType) && courtBookingRepository != null) {
                com.sporthub.backend.entity.CourtBooking cb = courtBookingRepository.findByPaymentId(txPaymentId);
                if (cb != null) bookingId = cb.getCourtBookingId();
            }
        }

        if ("MEMBERSHIP_PACKAGE".equals(bookingType)) {
            bookingId = origTx.getMembershipId(); bookingType = "MEMBERSHIP";
        }
        if (bookingService == null || !bookingService.isRefundEligible(origTx)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch không đủ điều kiện hoàn tiền theo chính sách hủy.");
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
        if (auth == null || auth.getAuthorities().stream().noneMatch(a -> List.of("ROLE_MANAGER", "ROLE_ADMIN").contains(a.getAuthority())))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        RefundRequest refund = refundRepository.findByIdForUpdate(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu hoàn tiền."));
        if (!List.of("PENDING_APPROVAL", "PENDING").contains(refund.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Yêu cầu đã được xử lý.");
        if (!decision.approved() && (decision.decisionNote() == null || decision.decisionNote().isBlank()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng ghi lý do từ chối.");
        Long managerId = getUserId(auth);
        if (!decision.approved()) {
            refund.setStatus("REJECTED"); refund.setDecisionNote(decision.decisionNote()); refund.setApprovedBy(managerId);
            if (bookingService != null && refund.getBookingId() != null && refund.getBookingType() != null
                    && !"MEMBERSHIP".equalsIgnoreCase(refund.getBookingType())) {
                bookingService.restoreBookingAfterRefundRejection(refund.getBookingId(), refund.getBookingType());
            }
        } else {
            PaymentTransaction tx = paymentTransactionRepository.findByIdForUpdate(refund.getTransactionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thiếu giao dịch gốc, cần đối soát."));
            if (!refund.getMemberId().equals(tx.getMemberId()) || !"PAID".equals(tx.getPaymentStatus())
                    || refund.getRefundAmount().compareTo(tx.getAmount()) != 0)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch hoàn tiền không hợp lệ.");
            if (bookingService != null) bookingService.prepareRefund(tx);
            if ("VNPAY".equals(tx.getPaymentMethod())) {
                Map<String, Object> result;
                try { result = vnpayGateway.refundPayment(tx, refund.getRefundAmount(), refund.getReason()); }
                catch (Exception e) { result = Map.of("vnp_ResponseCode", "99"); }
                if (result == null || !"00".equals(result.get("vnp_ResponseCode"))) {
                    String gatewayMsg = result != null ? java.util.Objects.toString(result.get("vnp_Message"), "") : "";
                    String note = "Hoàn tiền chưa thành công; cần đối soát cổng thanh toán trước khi thử lại.";
                    if (!gatewayMsg.isBlank()) {
                        note += " (" + gatewayMsg + ")";
                    }
                    refund.setDecisionNote(note);
                    return ResponseEntity.ok(toDTO(refundRepository.save(refund)));
                }
            }
            tx.setPaymentStatus("REFUNDED"); paymentTransactionRepository.save(tx);
            if (gatewayReceipts != null && "VNPAY".equals(tx.getPaymentMethod()))
                gatewayReceipts.findByGatewayTransactionNo(tx.getReferenceCode())
                    .filter(r -> tx.getPaymentId().equals(r.getPaymentId()) && "APPLIED".equals(r.getStatus()))
                    .ifPresent(r -> { r.setStatus("REFUNDED"); r.setResolvedAt(LocalDateTime.now()); gatewayReceipts.save(r); });
            if (tx.getMembershipId() != null && paymentRepository != null) {
                Long membershipId = tx.getMembershipId();
                paymentRepository.findByMemberIdOrderByCreatedAtDesc(Math.toIntExact(tx.getMemberId())).stream()
                    .filter(receipt -> receipt.getMembershipId() != null && receipt.getMembershipId().longValue() == membershipId)
                    .forEach(receipt -> { receipt.setPaymentStatus("REFUNDED"); paymentRepository.save(receipt); });
            }
            refund.setStatus("APPROVED"); refund.setApprovedBy(managerId); refund.setDecisionNote(decision.decisionNote());
            if (refund.getBookingId() != null && refund.getBookingType() != null) {
                if ("MEMBERSHIP".equalsIgnoreCase(refund.getBookingType()) && membershipService != null) {
                    membershipService.cancelMembershipAfterRefund(refund.getBookingId(), id);
                } else if (!"MEMBERSHIP".equalsIgnoreCase(refund.getBookingType()) && bookingService != null) {
                    bookingService.cancelBookingAfterRefund(refund.getBookingId(), refund.getBookingType(), id);
                }
            }
        }
        if (engagementService != null) {
            engagementService.audit(managerId, "MANAGER", "REFUND_DECIDED", "refundId=" + id + ", status=" + refund.getStatus());
            String statusText = "APPROVED".equals(refund.getStatus()) ? "đã được phê duyệt" : "đã bị từ chối";
            String noteSuffix = ("REJECTED".equals(refund.getStatus()) && refund.getDecisionNote() != null && !refund.getDecisionNote().isBlank())
                    ? " Lý do: " + refund.getDecisionNote().trim()
                    : "";
            engagementService.notifyUser(
                    refund.getMemberId(),
                    "Kết quả yêu cầu hoàn tiền",
                    "Yêu cầu hoàn tiền #" + id + " " + statusText + "." + noteSuffix,
                    "REFUND");
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
