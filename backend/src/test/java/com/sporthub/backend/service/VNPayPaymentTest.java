package com.sporthub.backend.service;

import com.sporthub.backend.constants.PaymentConstants;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.service.gateway.VNPayGateway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for VNPay Payment Flow
 * 
 * Tests VNPay Sandbox payment creation, signature verification, and IPN handling
 */
@ExtendWith(MockitoExtension.class)
class VNPayPaymentTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    private PaymentService paymentService;
    private VNPayGateway vnpayGateway;

    // VNPay Sandbox test credentials
    private static final String TEST_TMN_CODE = "3EM8RDXQ";
    private static final String TEST_HASH_SECRET = "VNPAY_TEST_SECRET_KEY_12345";
    private static final String TEST_VNPAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentTransactionRepository);
        vnpayGateway = new VNPayGateway();
        
        // Configure VNPay with test credentials
        ReflectionTestUtils.setField(vnpayGateway, "tmnCode", TEST_TMN_CODE);
        ReflectionTestUtils.setField(vnpayGateway, "hashSecret", TEST_HASH_SECRET);
        ReflectionTestUtils.setField(vnpayGateway, "vnpayUrl", TEST_VNPAY_URL);
        ReflectionTestUtils.setField(vnpayGateway, "returnUrl", "http://localhost:5173/vnpay-return");
        ReflectionTestUtils.setField(vnpayGateway, "ipnUrl", "http://localhost:8080/api/vnpay-webhook/ipn");
    }

    @Test
    void testCreateVNPayPayment_Success() {
        // Given
        Long memberId = 37L;
        BigDecimal amount = new BigDecimal("180000");
        
        PaymentTransaction mockPayment = new PaymentTransaction();
        mockPayment.setPaymentId(123L);
        mockPayment.setMemberId(memberId);
        mockPayment.setBookingType(PaymentConstants.BOOKING_TYPE_CLASS);
        mockPayment.setAmount(amount);
        mockPayment.setPaymentMethod(PaymentConstants.METHOD_VNPAY);
        mockPayment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_PENDING);
        mockPayment.setReferenceCode("CLS-ABCD123456");
        mockPayment.setCreatedAt(LocalDateTime.now());
        
        when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
                .thenReturn(mockPayment);

        // When
        PaymentTransaction payment = paymentService.createPayment(
                memberId, 
                PaymentConstants.BOOKING_TYPE_CLASS, 
                amount, 
                PaymentConstants.METHOD_VNPAY
        );

        // Then
        assertNotNull(payment);
        assertEquals(PaymentConstants.METHOD_VNPAY, payment.getPaymentMethod());
        assertEquals(PaymentConstants.PAYMENT_STATUS_PENDING, payment.getPaymentStatus());
        assertEquals(amount, payment.getAmount());
        
        ArgumentCaptor<PaymentTransaction> paymentCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(paymentCaptor.capture());
        
        PaymentTransaction savedPayment = paymentCaptor.getValue();
        assertEquals(PaymentConstants.METHOD_VNPAY, savedPayment.getPaymentMethod());
        assertEquals(PaymentConstants.PAYMENT_STATUS_PENDING, savedPayment.getPaymentStatus());
    }

    @Test
    void testGenerateVNPayPaymentURL_ContainsRequiredParameters() {
        // Given
        Long paymentId = 123L;
        BigDecimal amount = new BigDecimal("180000");
        String ipAddress = "127.0.0.1";

        // When
        Map<String, Object> result = vnpayGateway.generatePayment(paymentId, amount, "Test payment", ipAddress);

        // Then
        assertNotNull(result);
        assertEquals(paymentId, result.get("paymentId"));
        assertEquals(amount, result.get("amount"));
        assertEquals("VNPAY", result.get("gateway"));
        
        String paymentUrl = (String) result.get("paymentUrl");
        assertNotNull(paymentUrl);
        assertTrue(paymentUrl.startsWith(TEST_VNPAY_URL));
        assertTrue(paymentUrl.contains("vnp_TmnCode=" + TEST_TMN_CODE));
        assertTrue(paymentUrl.contains("vnp_Amount=18000000")); // 180000 * 100
        assertTrue(paymentUrl.contains("vnp_TxnRef=" + paymentId));
        assertTrue(paymentUrl.contains("vnp_Command=pay"));
        assertTrue(paymentUrl.contains("vnp_Version=2.1.0"));
        assertTrue(paymentUrl.contains("vnp_SecureHash="));
    }

    @Test
    void testVNPaySignatureVerification_ValidSignature() {
        // Given - Simulate VNPay IPN callback parameters
        Map<String, String> ipnParams = Map.of(
                "vnp_TxnRef", "123",
                "vnp_Amount", "18000000",
                "vnp_ResponseCode", "00",
                "vnp_TransactionNo", "14658296",
                "vnp_PayDate", "20261102010203"
        );
        
        // Generate signature using the same secret
        String hashData = "vnp_Amount=18000000&vnp_PayDate=20261102010203&vnp_ResponseCode=00&vnp_TransactionNo=14658296&vnp_TxnRef=123";
        String expectedSignature = generateHmacSHA512(TEST_HASH_SECRET, hashData);

        // When
        boolean isValid = vnpayGateway.verifySignature(ipnParams, expectedSignature);

        // Then
        assertTrue(isValid);
    }

    @Test
    void testVNPaySignatureVerification_InvalidSignature() {
        // Given
        Map<String, String> ipnParams = Map.of(
                "vnp_TxnRef", "123",
                "vnp_Amount", "18000000",
                "vnp_ResponseCode", "00"
        );
        String fakeSignature = "INVALID_SIGNATURE_12345";

        // When
        boolean isValid = vnpayGateway.verifySignature(ipnParams, fakeSignature);

        // Then
        assertFalse(isValid);
    }

    @Test
    void testPaymentMethodNormalization() {
        // Test that "VNPAY" is normalized correctly
        when(paymentTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        
        PaymentTransaction payment = paymentService.createPayment(
                100L, 
                PaymentConstants.BOOKING_TYPE_CLASS, 
                new BigDecimal("100000"), 
                "vnpay" // lowercase
        );
        
        assertEquals("VNPAY", payment.getPaymentMethod());
    }

    @Test
    void testVNPayPayment_InitialStatusPending() {
        // VNPay payments should start with PENDING status
        when(paymentTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        
        PaymentTransaction payment = paymentService.createPayment(
                100L,
                PaymentConstants.BOOKING_TYPE_COURT,
                new BigDecimal("60000"),
                PaymentConstants.METHOD_VNPAY
        );
        
        assertEquals(PaymentConstants.PAYMENT_STATUS_PENDING, payment.getPaymentStatus());
    }

    @Test
    void testCashPayment_PendingUntilCashierConfirms() {
        // Cash payments should start with PAID status
        when(paymentTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        
        PaymentTransaction payment = paymentService.createPayment(
                100L,
                PaymentConstants.BOOKING_TYPE_COURT,
                new BigDecimal("60000"),
                PaymentConstants.METHOD_CASH_COUNTER
        );
        
        assertEquals(PaymentConstants.PAYMENT_STATUS_PENDING, payment.getPaymentStatus());
    }

    @Test
    void testAmountConversion_VNDtoSmallestUnit() {
        // VNPay requires amount in smallest unit (multiply by 100)
        Long paymentId = 123L;
        BigDecimal amount = new BigDecimal("150000"); // 150,000 VND
        
        Map<String, Object> result = vnpayGateway.generatePayment(paymentId, amount, "Test", "127.0.0.1");
        String paymentUrl = (String) result.get("paymentUrl");
        
        assertTrue(paymentUrl.contains("vnp_Amount=15000000")); // 150000 * 100
    }

    @Test
    void testReferenceCodeGeneration_ClassBooking() {
        when(paymentTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        
        PaymentTransaction payment = paymentService.createPayment(
                100L,
                PaymentConstants.BOOKING_TYPE_CLASS,
                new BigDecimal("100000"),
                PaymentConstants.METHOD_VNPAY
        );
        
        assertNotNull(payment.getReferenceCode());
        assertTrue(payment.getReferenceCode().startsWith("CLS-"));
        assertEquals(14, payment.getReferenceCode().length()); // CLS-XXXXXXXXXX
    }

    @Test
    void testReferenceCodeGeneration_CourtBooking() {
        when(paymentTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        
        PaymentTransaction payment = paymentService.createPayment(
                100L,
                PaymentConstants.BOOKING_TYPE_COURT,
                new BigDecimal("60000"),
                PaymentConstants.METHOD_VNPAY
        );
        
        assertNotNull(payment.getReferenceCode());
        assertTrue(payment.getReferenceCode().startsWith("CRT-"));
    }

    @Test
    void testReferenceCodeGeneration_MembershipPackage() {
        when(paymentTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        
        PaymentTransaction payment = paymentService.createPayment(
                100L,
                PaymentConstants.BOOKING_TYPE_MEMBERSHIP,
                new BigDecimal("500000"),
                PaymentConstants.METHOD_VNPAY
        );
        
        assertNotNull(payment.getReferenceCode());
        assertTrue(payment.getReferenceCode().startsWith("PKG-"));
    }

    // Helper method to generate HMAC SHA512 signature
    private String generateHmacSHA512(String key, String data) {
        try {
            javax.crypto.Mac hmac512 = javax.crypto.Mac.getInstance("HmacSHA512");
            javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(
                    key.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            
            byte[] hashBytes = hmac512.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            
            StringBuilder result = new StringBuilder();
            for (byte b : hashBytes) {
                result.append(String.format("%02x", b));
            }
            return result.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating HMAC SHA512", e);
        }
    }
}
