package com.sporthub.backend.dto;

import lombok.Data;

/**
 * DTO nhận dữ liệu webhook từ SePay khi có giao dịch tiền vào/ra
 * 
 * Payload mẫu từ SePay:
 * {
 *   "id": 1234567,
 *   "gateway": "BIDV",
 *   "transactionDate": "2024-12-25 12:30:00",
 *   "accountNo": "962470DS8D",
 *   "code": "FT24356789012",
 *   "content": "FSPORT BK12345",
 *   "transferType": "in",
 *   "transferAmount": 50000,
 *   "accumulated": 1234567.89,
 *   "subAccount": "",
 *   "referenceCode": "BIDV123456789"
 * }
 */
@Data
public class SePayWebhookDTO {
    
    /**
     * ID giao dịch duy nhất của SePay
     */
    private Long id;
    
    /**
     * Tên ngân hàng/gateway (VD: BIDV, VCB, TCB...)
     */
    private String gateway;
    
    /**
     * Ngày giờ giao dịch (format: yyyy-MM-dd HH:mm:ss)
     */
    private String transactionDate;
    
    /**
     * Số tài khoản VA nhận tiền (VD: 962470DS8D)
     */
    private String accountNo;
    
    /**
     * Mã giao dịch SePay (unique identifier)
     */
    private String code;
    
    /**
     * Nội dung chuyển khoản khách nhập (VD: "FSPORT BK12345" hoặc "out" (tiền ra))
     */
    private String content; // Nội dung chuyển khoản khách nhập (VD: FSPORT BK12345)
    
    /**
     * Loại giao dịch: "in" (tiền vào) hoặc "out" (tiền ra)
     */
    private String transferType; // "in" (tiền vào) hoặc "out" (tiền ra)
    
    /**
     * Số tiền giao dịch
     */
    private Double transferAmount;
    
    /**
     * Số dư tài khoản sau giao dịch
     */
    private Double accumulated;
    
    /**
     * SubAccount (nếu có - thường null)
     */
    private String subAccount;
    
    /**
     * Mã tham chiếu giao dịch ngân hàng gốc
     */
    private String referenceCode;
}
