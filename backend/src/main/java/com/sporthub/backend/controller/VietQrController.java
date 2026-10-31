package com.sporthub.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller tạo mã QR thanh toán VietQR tích hợp SePay
 * 
 * Luồng:
 * 1. Frontend gọi /api/v1/payment/generate-qr với bookingId và amount
 * 2. Backend tạo URL VietQR với thông tin tài khoản BIDV VA của F Sport Center
 * 3. Nội dung chuyển khoản theo format: "FSPORT <bookingId>"
 * 4. SePay webhook sẽ nhận được thông báo khi có tiền vào và tự động cập nhật payment
 */
@RestController
@RequestMapping("/api/v1/payment")
@CrossOrigin(origins = "*")
public class VietQrController {

    // Cấu hình ngân hàng BIDV với VA của SePay cho F Sport Center (từ hình PNG - 2)
    private static final String BANK_ID = "BIDV"; // Hoặc "970418" - mã BIN BIDV
    private static final String ACCOUNT_NO = "962470DS8D"; // Số VA đã được liên kết với SePay
    private static final String ACCOUNT_NAME = "F SPORT CENTER"; // Tên gợi nhớ
    private static final String TEMPLATE = "compact2"; // Kiểu hiển thị QR: compact2, print, qr_only
    
    /**
     * API tạo mã QR VietQR để thanh toán booking
     * 
     * @param paymentId ID của payment transaction (duy nhất trên toàn hệ thống)
     * @param amount Số tiền cần thanh toán (VD: 50000)
     * @return JSON chứa qrUrl và thông tin thanh toán
     * 
     * Rule 10 (updated): Nội dung chuyển khoản dùng payment_id thay vì booking_id
     * - Format: FSPORT <payment_id>
     * - VD: FSPORT 128
     * 
     * Example: GET /api/v1/payment/generate-qr?paymentId=128&amount=50000
     */
    @GetMapping("/generate-qr")
    public ResponseEntity<?> generateQr(
            @RequestParam Long paymentId,
            @RequestParam double amount) {

        // Rule 10: Nội dung chuyển khoản dùng payment_id (duy nhất, đơn giản)
        String addInfo = "FSPORT " + paymentId;
        
        // Bọc encode URL để tránh lỗi khoảng trắng
        String encodedAccountName = URLEncoder.encode(ACCOUNT_NAME, StandardCharsets.UTF_8);
        String encodedAddInfo = URLEncoder.encode(addInfo, StandardCharsets.UTF_8);
        
        // Tạo VietQR URL từ dịch vụ miễn phí VietQR API
        String qrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-%s.png?amount=%.0f&addInfo=%s&accountName=%s",
                BANK_ID, ACCOUNT_NO, TEMPLATE, amount, encodedAddInfo, encodedAccountName
        );
        
        // Tạo response JSON để Frontend hiển thị
        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", paymentId);
        response.put("amount", amount);
        response.put("accountNo", ACCOUNT_NO);
        response.put("accountName", ACCOUNT_NAME);
        response.put("addInfo", addInfo);
        response.put("qrUrl", qrUrl);
        
        return ResponseEntity.ok(response);
    }
}
