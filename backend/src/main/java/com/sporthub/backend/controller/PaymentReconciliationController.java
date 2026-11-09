package com.sporthub.backend.controller;

import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.EngagementService;
import com.sporthub.backend.service.gateway.VNPayGateway;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/manager/payment-reconciliation")
public class PaymentReconciliationController {
    private final GatewayReceiptRepository receipts;
    private final PaymentTransactionRepository payments;
    private final VNPayGateway gateway;
    private final EngagementService engagement;
    public PaymentReconciliationController(GatewayReceiptRepository receipts, PaymentTransactionRepository payments,
            VNPayGateway gateway, EngagementService engagement) {
        this.receipts = receipts; this.payments = payments; this.gateway = gateway; this.engagement = engagement;
    }
    @GetMapping @Transactional(readOnly = true)
    public List<GatewayReceipt> pending() { return receipts.findByStatusInOrderByCreatedAtDesc(List.of("EXCESS", "REVIEW_REQUIRED")); }

    @PostMapping("/{id}/refund") @Transactional
    public GatewayReceipt refund(@PathVariable Long id, Authentication auth) {
        if (auth == null || auth.getAuthorities().stream().noneMatch(a -> Set.of("ROLE_MANAGER", "ROLE_ADMIN").contains(a.getAuthority())))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        GatewayReceipt candidate = receipts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        PaymentTransaction order = payments.findByIdForUpdate(candidate.getPaymentId()).orElseThrow();
        GatewayReceipt receipt = receipts.findByIdForUpdate(id).orElseThrow();
        if (!"EXCESS".equals(receipt.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Khoản thu đã xử lý hoặc cần đối soát thủ công; không gửi hoàn lần nữa.");
        if (receipt.getTransactionDate() == null || receipt.getTransactionDate().isBlank())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Thiếu ngày giao dịch gateway; cần đối soát trước.");
        // Refund this receipt, never the canonical order's gateway transaction or its entitlements.
        PaymentTransaction source = new PaymentTransaction(); source.setPaymentId(order.getPaymentId()); source.setMemberId(order.getMemberId());
        source.setAmount(receipt.getAmount()); source.setReferenceCode(receipt.getGatewayTransactionNo()); source.setGatewayReference(receipt.getGatewayReference());
        source.setTransactionDate(receipt.getTransactionDate()); source.setCreatedAt(receipt.getCreatedAt());
        Map<String, Object> outcome;
        try { outcome = gateway.refundPayment(source, receipt.getAmount(), "Hoàn khoản thanh toán dư #" + id, "excess-receipt:" + receipt.getGatewayTransactionNo()); }
        catch (Exception e) { outcome = Map.of("vnp_ResponseCode", "99"); }
        if (outcome != null && "00".equals(outcome.get("vnp_ResponseCode"))) {
            receipt.setStatus("REFUNDED"); receipt.setResolvedAt(LocalDateTime.now()); receipt.setReconciliationNote("Gateway xác nhận hoàn thành công.");
        } else {
            receipt.setStatus("REVIEW_REQUIRED"); receipt.setReconciliationNote("Gateway chưa xác nhận hoàn thành công. Đối soát kết quả trước khi xử lý tiếp; không tự gửi lại.");
        }
        receipts.save(receipt);
        engagement.audit(Long.valueOf(auth.getName()), "MANAGER", "EXCESS_PAYMENT_REFUND", "receiptId=" + id + ", status=" + receipt.getStatus());
        return receipt;
    }
}
