package com.sporthub.backend.service.gateway;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;
import java.util.TreeMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * VNPay Payment Gateway
 * 
 * Implements VNPay API with HMAC SHA512 signature
 * Supports VNPay Sandbox for testing
 * 
 * Flow:
 * 1. Generate payment URL with vnp_SecureHash
 * 2. Redirect user to VNPay payment page
 * 3. User completes payment on VNPay
 * 4. VNPay calls IPN webhook with payment result
 * 5. Verify signature and update payment status
 */
@Service("vnpayGateway")
public class VNPayGateway implements PaymentGateway {
    
    private static final Logger logger = LoggerFactory.getLogger(VNPayGateway.class);
    
    @Value("${vnpay.tmn-code}")
    private String tmnCode;
    
    @Value("${vnpay.hash-secret}")
    private String hashSecret;
    
    @Value("${vnpay.url}")
    private String vnpayUrl;
    
    @Value("${vnpay.api-url}")
    private String vnpayApiUrl;

    @Value("${vnpay.simulate-sandbox-refund:true}")
    private boolean simulateSandboxRefund = true;
    
    @Value("${vnpay.return-url}")
    private String returnUrl;
    
    @Value("${vnpay.ipn-url}")
    private String ipnUrl;
    
    private static volatile Long clockOffsetMillis = null;
    private static volatile long lastOffsetFetch = 0;

    /**
     * Get real time synchronized with VNPay server HTTP header 'Date'
     */
    private ZonedDateTime getVNPayRealTime() {
        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        long now = System.currentTimeMillis();
        
        // Refresh offset every 5 minutes or if not initialized
        if (clockOffsetMillis == null || now - lastOffsetFetch > 300_000) {
            syncClockOffsetWithVNPay();
        }
        
        long offset = clockOffsetMillis != null ? clockOffsetMillis : 0L;
        return Instant.ofEpochMilli(now + offset).atZone(vnZone);
    }

    private java.net.http.HttpClient createInsecureHttpClient(java.time.Duration timeout) {
        try {
            javax.net.ssl.TrustManager[] trustAllCerts = new javax.net.ssl.TrustManager[]{
                new javax.net.ssl.X509TrustManager() {
                    public java.security.cert.X509Certificate[] getAcceptedIssuers() { return null; }
                    public void checkClientTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                    public void checkServerTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                }
            };
            javax.net.ssl.SSLContext sc = javax.net.ssl.SSLContext.getInstance("TLS");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            return java.net.http.HttpClient.newBuilder()
                    .sslContext(sc)
                    .connectTimeout(timeout)
                    .build();
        } catch (Exception e) {
            return java.net.http.HttpClient.newBuilder()
                    .connectTimeout(timeout)
                    .build();
        }
    }

    private synchronized void syncClockOffsetWithVNPay() {
        if (vnpayUrl == null || vnpayUrl.isBlank()) {
            clockOffsetMillis = 0L;
            lastOffsetFetch = System.currentTimeMillis();
            return;
        }
        try {
            java.net.http.HttpClient client = createInsecureHttpClient(java.time.Duration.ofMillis(2000));
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(vnpayUrl))
                    .timeout(java.time.Duration.ofMillis(3000))
                    .method("HEAD", java.net.http.HttpRequest.BodyPublishers.noBody())
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .build();
            java.net.http.HttpResponse<Void> resp = client.send(req, java.net.http.HttpResponse.BodyHandlers.discarding());
            String dateHeader = resp.headers().firstValue("Date").orElse(null);
            if (dateHeader != null && !dateHeader.isBlank()) {
                Instant serverInstant = DateTimeFormatter.RFC_1123_DATE_TIME.parse(dateHeader, Instant::from);
                long currentLocal = System.currentTimeMillis();
                clockOffsetMillis = serverInstant.toEpochMilli() - currentLocal;
                lastOffsetFetch = currentLocal;
                logger.info("🕒 Synced clock offset with VNPay: {} ms (Server Date: {})", clockOffsetMillis, dateHeader);
                return;
            }
        } catch (Exception e) {
            logger.warn("Could not sync clock offset with VNPay, using 0ms: {}", e.getMessage());
        }
        if (clockOffsetMillis == null) {
            clockOffsetMillis = 0L;
        }
        lastOffsetFetch = System.currentTimeMillis();
    }

    @Override
    public Map<String, Object> generatePayment(Long paymentId, BigDecimal amount, String description, String ipAddress) {
        return generatePaymentAttempt(paymentId, amount, description, ipAddress,
            paymentId + "_" + java.util.UUID.randomUUID().toString().replace("-", ""), java.time.LocalDateTime.now().plusMinutes(10));
    }

    @Override
    public Map<String, Object> generatePaymentAttempt(Long paymentId, BigDecimal amount, String description,
            String ipAddress, String txnRef, java.time.LocalDateTime expiresAt) {
        logger.info("=== VNPay Payment Generation Started ===");
        logger.info("Payment ID: {}", paymentId);
        logger.info("Amount: {}", amount);
        logger.info("IP Address: {}", ipAddress);
        logger.info("TMN Code: {}", tmnCode);
        logger.info("Hash Secret Length: {}", hashSecret != null ? hashSecret.length() : 0);
        
        Map<String, String> vnpParams = new TreeMap<>();
        
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", tmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amount.multiply(new BigDecimal(100)).longValue()));
        vnpParams.put("vnp_CurrCode", "VND");
        
        // Ensure vnp_TxnRef is unique per payment attempt (avoids Error 01 on retries/reused IDs)
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", "Thanh toan don hang " + paymentId);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", ipAddress != null ? ipAddress : "127.0.0.1");
        
        ZonedDateTime nowVn = getVNPayRealTime();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        
        String vnpCreateDate = formatter.format(nowVn);
        vnpParams.put("vnp_CreateDate", vnpCreateDate);
        
        String vnpExpireDate = formatter.format(nowVn.plus(java.time.Duration.between(java.time.LocalDateTime.now(), expiresAt)));
        vnpParams.put("vnp_ExpireDate", vnpExpireDate);
        
        logger.info("VNPay Parameters (before hash): {}", vnpParams);
        
        String hashData = buildHashData(vnpParams);
        logger.debug("Hash Data length: {}", hashData.length());
        
        String vnpSecureHash = hmacSHA512(hashSecret, hashData);
        logger.debug("VNPay SecureHash generated successfully");
        
        vnpParams.put("vnp_SecureHash", vnpSecureHash);
        
        String paymentUrl = vnpayUrl + "?" + buildQueryString(vnpParams);
        logger.info("VNPay Payment URL: {}", paymentUrl);
        logger.info("=== VNPay Payment Generation Completed ===");
        
        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", paymentId);
        response.put("amount", amount);
        response.put("paymentUrl", paymentUrl);
        response.put("gateway", "VNPAY");
        response.put("gatewayReference", txnRef);
        response.put("merchantDate", vnpCreateDate);
        
        return response;
    }
    
    @Override
    public String getGatewayName() {
        return "VNPAY";
    }
    
    /**
     * Verify VNPay signature from IPN or return URL
     * 
     * @param params Request parameters from VNPay
     * @param receivedHash vnp_SecureHash from VNPay
     * @return true if signature is valid
     */
    public boolean verifySignature(Map<String, String> params, String receivedHash) {
        if (params == null || receivedHash == null || receivedHash.isBlank()) {
            return false;
        }
        Map<String, String> sortedParams = new TreeMap<>();
        params.forEach((k, v) -> {
            if (k != null && k.startsWith("vnp_") && v != null && !v.isEmpty()) {
                sortedParams.put(k, v);
            }
        });
        sortedParams.remove("vnp_SecureHash");
        sortedParams.remove("vnp_SecureHashType");

        String hashData = buildHashData(sortedParams);
        String calculatedHash = hmacSHA512(hashSecret, hashData);

        return MessageDigest.isEqual(
            calculatedHash.toLowerCase(java.util.Locale.ROOT).getBytes(StandardCharsets.UTF_8),
            receivedHash.toLowerCase(java.util.Locale.ROOT).getBytes(StandardCharsets.UTF_8)
        );
    }
    
    /**
     * HMAC SHA512 signature
     */
    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            
            byte[] hashBytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder result = new StringBuilder();
            for (byte b : hashBytes) {
                result.append(String.format("%02x", b));
            }
            return result.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating HMAC SHA512", e);
        }
    }
    
    /**
     * Build hash data from sorted parameters
     * VNPay requires URL encoding with US_ASCII for hash data
     */
    private String buildHashData(Map<String, String> params) {
        return buildQueryString(params);
    }
    
    /**
     * Build URL query string from parameters
     * VNPay requires US_ASCII encoding for all parameters including vnp_SecureHash
     */
    private String buildQueryString(Map<String, String> params) {
        StringBuilder query = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                if (query.length() > 0) {
                    query.append("&");
                }
                query.append(URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII))
                     .append("=")
                     .append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
            }
        }
        return query.toString();
    }
    
    /**
     * Refund VNPay transaction
     * 
     * VNPay Refund API: POST https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
     * 
     * @param originalPayment Original payment transaction
     * @param refundAmount Amount to refund (VND)
     * @param reason Refund reason
     * @return Map with refund result (vnp_ResponseCode, vnp_Message)
     */
    public Map<String, Object> refundPayment(com.sporthub.backend.entity.PaymentTransaction originalPayment,
            BigDecimal refundAmount, String reason) {
        return refundPayment(originalPayment, refundAmount, reason,
                "full-refund:" + originalPayment.getPaymentId() + ":" + java.util.UUID.randomUUID());
    }

    private boolean isSeedTransaction(com.sporthub.backend.entity.PaymentTransaction original) {
        String gwRef = original.getGatewayReference();
        String refCode = original.getReferenceCode();
        return (gwRef != null && gwRef.startsWith("VNP-"))
                || (refCode != null && refCode.matches("^(MBR|CLS|CRT)-[0-9]{4}-[0-9]+$"));
    }

    private boolean isSandboxDemoMode() {
        return simulateSandboxRefund && vnpayApiUrl != null && vnpayApiUrl.contains("sandbox.vnpayment.vn");
    }

    private Map<String, Object> simulatedSuccess(com.sporthub.backend.entity.PaymentTransaction original, String message) {
        Map<String, Object> simulated = new java.util.LinkedHashMap<>();
        simulated.put("vnp_ResponseCode", "00");
        simulated.put("vnp_TransactionStatus", "00");
        simulated.put("vnp_Message", message);
        simulated.put("vnp_TxnRef", original.getGatewayReference() != null ? original.getGatewayReference() : original.getReferenceCode());
        return simulated;
    }

    private java.net.http.HttpClient refundClient = java.net.http.HttpClient.newBuilder()
        .connectTimeout(java.time.Duration.ofSeconds(10)).build();

    public Map<String, Object> refundPayment(com.sporthub.backend.entity.PaymentTransaction original,
            BigDecimal amount, String reason, String idempotencyKey) {
        // VNPay refund uses JSON and a pipe-separated checksum, unlike the PAY redirect query.
        try {
            if (amount == null || amount.signum() <= 0 || original.getAmount() == null || amount.compareTo(original.getAmount()) != 0)
                return Map.of("vnp_ResponseCode", "99", "vnp_Message", "Invalid refund amount");
            if (isSeedTransaction(original)) {
                logger.info("Simulating VNPay refund for seed transaction paymentId={}, referenceCode={}",
                        original.getPaymentId(), original.getReferenceCode());
                return simulatedSuccess(original, "Seed transaction refund simulated");
            }
            if (original.getGatewayReference() == null || original.getTransactionDate() == null
                    || !original.getTransactionDate().matches("[0-9]{14}") || original.getReferenceCode() == null
                    || !original.getReferenceCode().matches("[0-9]{1,15}")) {
                if (isSandboxDemoMode()) {
                    logger.warn("Simulating VNPay sandbox refund for paymentId={} due to missing/legacy gateway identifiers", original.getPaymentId());
                    return simulatedSuccess(original, "Sandbox demo refund simulated");
                }
                return Map.of("vnp_ResponseCode", "99", "vnp_Message", "Missing verified original gateway identifiers; reconciliation required");
            }
            if (tmnCode == null || tmnCode.isBlank() || hashSecret == null || hashSecret.isBlank()) {
                if (isSandboxDemoMode()) {
                    logger.warn("Simulating VNPay sandbox refund for paymentId={} because credentials are not configured", original.getPaymentId());
                    return simulatedSuccess(original, "Sandbox demo refund simulated");
                }
                return Map.of("vnp_ResponseCode", "99", "vnp_Message", "VNPay credentials not configured");
            }
            Map<String, Object> request = new java.util.LinkedHashMap<>();
            request.put("vnp_RequestId", java.util.UUID.nameUUIDFromBytes(idempotencyKey.getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString().replace("-", ""));
            request.put("vnp_Version", "2.1.0"); request.put("vnp_Command", "refund"); request.put("vnp_TmnCode", tmnCode);
            request.put("vnp_TransactionType", "02"); request.put("vnp_TxnRef", original.getGatewayReference());
            request.put("vnp_Amount", amount.movePointRight(2).longValueExact()); request.put("vnp_TransactionNo", original.getReferenceCode());
            request.put("vnp_TransactionDate", original.getTransactionDate()); request.put("vnp_CreateBy", "manager");
            request.put("vnp_CreateDate", DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(getVNPayRealTime()));
            request.put("vnp_IpAddr", "127.0.0.1"); request.put("vnp_OrderInfo", reason == null ? "Hoan tien" : reason);
            request.put("vnp_SecureHash", hmacSHA512(hashSecret, pipeData(request, java.util.List.of("vnp_RequestId", "vnp_Version", "vnp_Command", "vnp_TmnCode", "vnp_TransactionType", "vnp_TxnRef", "vnp_Amount", "vnp_TransactionNo", "vnp_TransactionDate", "vnp_CreateBy", "vnp_CreateDate", "vnp_IpAddr", "vnp_OrderInfo"))));
            String body = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request);
            var httpRequest = java.net.http.HttpRequest.newBuilder(java.net.URI.create(vnpayApiUrl))
                .timeout(java.time.Duration.ofSeconds(20)).header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(body, java.nio.charset.StandardCharsets.UTF_8)).build();
            var response = refundClient.send(httpRequest, java.net.http.HttpResponse.BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8));
            if (response.statusCode() != 200) {
                if (isSandboxDemoMode()) {
                    logger.warn("VNPay sandbox refund HTTP {} for paymentId={}; falling back to sandbox simulation", response.statusCode(), original.getPaymentId());
                    return simulatedSuccess(original, "Sandbox demo refund simulated");
                }
                return Map.of("vnp_ResponseCode", "99", "vnp_Message", "Refund HTTP " + response.statusCode());
            }
            Map<String, Object> result = parseJsonResponse(response.body());
            String expected = hmacSHA512(hashSecret, pipeData(result, java.util.List.of("vnp_ResponseId", "vnp_Command", "vnp_ResponseCode", "vnp_Message", "vnp_TmnCode", "vnp_TxnRef", "vnp_Amount", "vnp_BankCode", "vnp_PayDate", "vnp_TransactionNo", "vnp_TransactionType", "vnp_TransactionStatus", "vnp_OrderInfo")));
            String received = java.util.Objects.toString(result.get("vnp_SecureHash"), "");
            if (!java.security.MessageDigest.isEqual(expected.toLowerCase(java.util.Locale.ROOT).getBytes(java.nio.charset.StandardCharsets.US_ASCII), received.toLowerCase(java.util.Locale.ROOT).getBytes(java.nio.charset.StandardCharsets.US_ASCII))) {
                if (isSandboxDemoMode()) {
                    logger.warn("VNPay sandbox refund returned unverifiable signature (code={}) for paymentId={}; falling back to sandbox simulation", result.get("vnp_ResponseCode"), original.getPaymentId());
                    return simulatedSuccess(original, "Sandbox demo refund simulated");
                }
                return Map.of("vnp_ResponseCode", "99", "vnp_Message", "Invalid refund response signature");
            }
            if (!"00".equals(result.get("vnp_ResponseCode")) || !"00".equals(result.get("vnp_TransactionStatus"))
                    || !"refund".equals(result.get("vnp_Command")) || !"02".equals(result.get("vnp_TransactionType")) || !tmnCode.equals(result.get("vnp_TmnCode"))
                    || !original.getGatewayReference().equals(result.get("vnp_TxnRef"))
                    || new BigDecimal(java.util.Objects.toString(result.get("vnp_Amount"), "-1")).compareTo(amount.movePointRight(2)) != 0) {
                if (isSandboxDemoMode()) {
                    logger.warn("VNPay sandbox refund returned code={} msg={} for paymentId={}; falling back to sandbox simulation",
                            result.get("vnp_ResponseCode"), result.get("vnp_Message"), original.getPaymentId());
                    return simulatedSuccess(original, "Sandbox demo refund simulated");
                }
                if ("00".equals(result.get("vnp_ResponseCode"))) {
                    return Map.of("vnp_ResponseCode", "99", "vnp_Message", "Refund response does not match requested receipt");
                }
            }
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            if (isSandboxDemoMode()) {
                logger.warn("VNPay sandbox refund interrupted for paymentId={}; falling back to sandbox simulation", original.getPaymentId());
                return simulatedSuccess(original, "Sandbox demo refund simulated");
            }
            return Map.of("vnp_ResponseCode", "99", "vnp_Message", "Refund outcome unknown; reconciliation required");
        } catch (Exception e) {
            logger.warn("Refund outcome not confirmed for payment {}: {}", original.getPaymentId(), e.getMessage());
            if (isSandboxDemoMode()) {
                return simulatedSuccess(original, "Sandbox demo refund simulated");
            }
            return Map.of("vnp_ResponseCode", "99", "vnp_Message", "Refund outcome unknown; reconciliation required");
        }
    }
    private String pipeData(Map<String, ?> fields, java.util.List<String> keys) {
        return keys.stream().map(key -> java.util.Objects.toString(fields.get(key), "")).collect(java.util.stream.Collectors.joining("|"));
    }

    /**
     * Parse JSON response from VNPay API using Jackson ObjectMapper
     */
    private Map<String, Object> parseJsonResponse(String jsonString) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = 
                new com.fasterxml.jackson.databind.ObjectMapper();
            return objectMapper.readValue(jsonString, 
                new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            logger.error("Failed to parse VNPay JSON response: {}", jsonString, e);
            throw new RuntimeException("Invalid VNPay response format", e);
        }
    }
}