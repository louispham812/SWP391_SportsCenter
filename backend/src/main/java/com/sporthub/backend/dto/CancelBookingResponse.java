package com.sporthub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelBookingResponse {
    private String bookingType;        // "CLASS" hoặc "COURT"
    private Long bookingId;
    private String status;             // "PENDING_APPROVAL", "ALREADY_REQUESTED", "CANCELLED"
    private String bookingTitle;       // Tên lớp hoặc sân
    private LocalDateTime startTime;
    private String refundStatus;       // "PENDING_APPROVAL", "NONE", null
    private Boolean refunded;          // true/false/null
    private BigDecimal refundAmount;
    private String refundPolicy;       // "100%", "50%", "No refund"
    private Long refundRequestId;      // ID của RefundRequest vừa tạo (nếu có)
    private Long paymentId;
    private String paymentMethod;
    private String paymentStatus;      // COMPLETED, REFUNDED, etc.
    private String message;            // Thông báo chính cho user
    private String detailMessage;      // Chi tiết bổ sung

    // Factory method cho case: Tạo RefundRequest mới (hủy trong 2h)
    public static CancelBookingResponse pendingApproval(
            String bookingType,
            Long bookingId,
            String bookingTitle,
            LocalDateTime startTime,
            BigDecimal refundAmount,
            Long refundRequestId,
            Long paymentId,
            String paymentMethod
    ) {
        return CancelBookingResponse.builder()
                .bookingType(bookingType)
                .bookingId(bookingId)
                .status("PENDING_APPROVAL")
                .bookingTitle(bookingTitle)
                .startTime(startTime)
                .refundStatus("PENDING_APPROVAL")
                .refunded(false)
                .refundAmount(refundAmount)
                .refundPolicy("100%")
                .refundRequestId(refundRequestId)
                .paymentId(paymentId)
                .paymentMethod(paymentMethod)
                .paymentStatus("COMPLETED")
                .message("Yêu cầu hoàn tiền đang chờ duyệt")
                .detailMessage("Yêu cầu hủy của bạn đã được gửi và đang chờ quản lý phê duyệt. Bạn sẽ nhận được thông báo khi có kết quả.")
                .build();
    }

    // Factory method cho case: RefundRequest đã tồn tại
    public static CancelBookingResponse alreadyRequested(
            String bookingType,
            Long bookingId,
            String bookingTitle,
            LocalDateTime startTime,
            BigDecimal refundAmount,
            Long existingRefundRequestId,
            Long paymentId,
            String paymentMethod,
            String refundRequestStatus
    ) {
        return CancelBookingResponse.builder()
                .bookingType(bookingType)
                .bookingId(bookingId)
                .status("ALREADY_REQUESTED")
                .bookingTitle(bookingTitle)
                .startTime(startTime)
                .refundStatus(refundRequestStatus)
                .refunded(false)
                .refundAmount(refundAmount)
                .refundPolicy("100%")
                .refundRequestId(existingRefundRequestId)
                .paymentId(paymentId)
                .paymentMethod(paymentMethod)
                .paymentStatus("COMPLETED")
                .message("Yêu cầu hoàn tiền đã tồn tại")
                .detailMessage("Bạn đã gửi yêu cầu hoàn tiền trước đó. Vui lòng chờ quản lý xử lý.")
                .build();
    }
}
